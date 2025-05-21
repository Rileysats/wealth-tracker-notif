const fs = require('fs').promises;
const path = require('path');
const stockService = require('./stockService');

class PortfolioService {
  constructor() {
    this.portfolioPath = path.join(__dirname, 'portfolio.json');
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
   * Update the portfolio data in the JSON file
   * @param {Object} portfolioData - Portfolio data to save
   * @returns {Promise<void>}
   */
  async updatePortfolio(portfolioData) {
    try {
      const data = JSON.stringify(portfolioData, null, 2);
      await fs.writeFile(this.portfolioPath, data, 'utf8');
    } catch (error) {
      console.error('Error updating portfolio data:', error.message);
      throw error;
    }
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
      // const exchange_rate_usd_to_aud = await stockService.fetchExchangeRate("USD")

      // Calculate performance for each stock
      const stocksPerformance = await Promise.all(
        portfolio.stocks.map(async portfolioStock => {

        // for (const portfolioStock of portfolio.stocks) {
          const stockData = stockDataList.find(data => data.symbol === portfolioStock.symbol);

          if (!stockData) {
            throw new Error(`No data available for symbol: ${portfolioStock.symbol}`);
          }

          let { currentPrice, previousClose, change, changePercent, currency } = stockData;

          // Calculate values
          let purchasePrice = portfolioStock.avg_buy_price * portfolioStock.quantity;
          let currentValue = currentPrice * portfolioStock.quantity;
          let previousValue = previousClose * portfolioStock.quantity;
          let valueChange = currentValue - previousValue;

          let overallDiff = currentValue - purchasePrice;
          let overallChange = ((currentValue - purchasePrice) / purchasePrice) * 100;

          if (currency !== "AUD") {
            const exchange_rate_to_aud = await stockService.fetchExchangeRate(currency)
            currentPrice     *= exchange_rate_to_aud;
            previousClose    *= exchange_rate_to_aud;
            change           *= exchange_rate_to_aud;
            currentValue     *= exchange_rate_to_aud;
            previousValue    *= exchange_rate_to_aud;
            purchasePrice    *= exchange_rate_to_aud;
            valueChange      *= exchange_rate_to_aud;
            overallDiff      *= exchange_rate_to_aud;
          }

          return {
            symbol: portfolioStock.symbol,
            name: portfolioStock.name,
            quantity: portfolioStock.quantity,
            currentPrice,
            previousClose,
            change,
            changePercent,
            currentValue,
            previousValue,
            purchasePrice,
            valueChange,
            overallDiff,
            overallChange
          };
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
