const fs = require('fs').promises;
const path = require('path');
const stockService = require('./stockService');

class PortfolioService {
  constructor() {
    this.portfolioPath = path.join(__dirname, 'portfolio.json');
    this.currency = process.env.CURRENCY || 'AUD';
  }

  /**
   * Read the portfolio data from the JSON file
   * @returns {Promise<Object>} - Portfolio data
   */
  async getPortfolio() {
    try {
      const data = await fs.readFile(this.portfolioPath, 'utf8');
      return JSON.parse(data);

    } catch (error) {
      console.error('Error reading portfolio data:', error.message);
      throw error;
    }
  }

  /**
   * Calculate performance metrics for a single stock in the portfolio
   * @param {Object} stockData - Latest stock data (price, change, etc.)
   * @param {Object} portfolioStock - Portfolio stock details (symbol, quantity, avg_buy_price, etc.)
   * @returns {Promise<Object>} - Calculated performance metrics for the stock
   */
  async calculateStockPerformance(stockData, portfolioStock) {
    let { currentPrice, previousClose, change, changePercent, currency, name} = stockData;

    // Calculate values
    let purchasePrice = portfolioStock.avg_buy_price * portfolioStock.quantity;
    let currentValue = currentPrice * portfolioStock.quantity;
    let previousValue = previousClose * portfolioStock.quantity;
    let overallDiff = currentValue - purchasePrice;
    let overallChange = ((currentValue - purchasePrice) / purchasePrice) * 100;
    let dayChange = change * portfolioStock.quantity;

    if (currency !== this.currency) {
      const exchange_rate_to_aud = await stockService.fetchExchangeRate(currency)
      currentPrice     *= exchange_rate_to_aud;
      change           *= exchange_rate_to_aud;
      dayChange        *= exchange_rate_to_aud;
      currentValue     *= exchange_rate_to_aud;
      previousValue    *= exchange_rate_to_aud;
      overallDiff      *= exchange_rate_to_aud;
      purchasePrice    *= exchange_rate_to_aud;
    }

    return {
      symbol: portfolioStock.symbol,
      name,
      quantity: portfolioStock.quantity,
      currentPrice,
      change,
      changePercent,
      dayChange,
      currentValue,
      previousValue,
      overallDiff,
      overallChange,
      purchasePrice
    };
  }

  /**
   * Get the current portfolio performance with stock data
   * @returns {Promise<Object>} - Portfolio performance data
   */
  async getPortfolioPerformance() {
    try {
      // Get portfolio data
      const portfolio = await this.getPortfolio();
      const symbols = portfolio.stocks.map(stock => stock.symbol);

      // Get stock data for all symbols
      const stockDataList = await stockService.getMultipleStockData(symbols);

      // Calculate performance for each stock
      const stocksPerformance = await Promise.all(
        portfolio.stocks.map(async portfolioStock => {

          const stockData = stockDataList.find(data => data.symbol === portfolioStock.symbol);

          if (!stockData) {
            throw new Error(`No data available for symbol: ${portfolioStock.symbol}`);
          }

          const performanceMetrics = this.calculateStockPerformance(stockData, portfolioStock)

          return performanceMetrics
        })
      );

      // Calculate total portfolio performance
      const totalCurrentValue = stocksPerformance.reduce((sum, stock) => sum + stock.currentValue, 0);
      const totalPreviousValue = stocksPerformance.reduce((sum, stock) => sum + stock.previousValue, 0);
      
      const totalValueChange = totalCurrentValue - totalPreviousValue;
      const totalChangePercent = (totalValueChange / totalPreviousValue) * 100;
      
      // Calculate overall portfolio performance
      const overallValueChange = stocksPerformance.reduce((sum, stock) => sum + stock.overallDiff, 0);
      const totalPurchaseValue = stocksPerformance.reduce((sum, stock) => sum + stock.purchasePrice, 0);
      const overallChangePercent = (overallValueChange / totalPurchaseValue) * 100;

      return {
        stocks: stocksPerformance,
        totalCurrentValue,
        totalValueChange,
        totalChangePercent,
        overallValueChange,
        overallChangePercent,
        date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting portfolio performance:', error.message);
      throw error;
    }
  }
}

module.exports = new PortfolioService();
