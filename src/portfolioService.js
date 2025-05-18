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
      const exchange_rate_usd_to_aud = await stockService.fetchExchangeRate()

      // Calculate performance for each stock
      const stocksPerformance = portfolio.stocks.map(portfolioStock => {
        const stockData = stockDataList.find(data => data.symbol === portfolioStock.symbol);

        if (!stockData) {
          throw new Error(`No data available for symbol: ${portfolioStock.symbol}`);
        }

        let { currentPrice, previousClose, change, changePercent } = stockData;
        const quantity = portfolioStock.quantity;
        const avg_buy_price = portfolioStock.avg_buy_price;
        const initial_value = portfolioStock.initial_value;

        // Calculate values
        let currentValue = currentPrice * quantity;
        let previousValue = previousClose * quantity;
        let valueChange = currentValue - previousValue;

        let overallDiff = currentValue - portfolioStock.initial_value;
        let overallChange = ((currentValue - portfolioStock.initial_value) / portfolioStock.initial_value) * 100;

        if (!portfolioStock.symbol.endsWith(".AX")) {
          currentPrice     *= exchange_rate_usd_to_aud;
          previousClose    *= exchange_rate_usd_to_aud;
          change           *= exchange_rate_usd_to_aud;
          currentValue     *= exchange_rate_usd_to_aud;
          previousValue    *= exchange_rate_usd_to_aud;
          valueChange      *= exchange_rate_usd_to_aud;
          overallDiff      *= exchange_rate_usd_to_aud;
        }

        return {
          symbol: portfolioStock.symbol,
          name: portfolioStock.name,
          quantity,
          currentPrice,
          previousClose,
          change,
          changePercent,
          currentValue,
          previousValue,
          valueChange,
          overallDiff,
          overallChange
        };
      });

      // Calculate total portfolio performance
      const totalCurrentValue = stocksPerformance.reduce((sum, stock) => sum + stock.currentValue, 0);
      const totalPreviousValue = stocksPerformance.reduce((sum, stock) => sum + stock.previousValue, 0);

      const overallValueChange = stocksPerformance.reduce((sum, stock) => sum + stock.overallDiff, 0);
      console.log("STOCK");
      console.log(stocksPerformance);
      console.log(overallValueChange);
      const totalValueChange = totalCurrentValue - totalPreviousValue;
      const totalChangePercent = (totalValueChange / totalPreviousValue) * 100;

      return {
        stocks: stocksPerformance,
        totalCurrentValue,
        totalValueChange,
        totalChangePercent,
        overallValueChange,
        date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting portfolio performance:', error.message);
      throw error;
    }
  }
}

module.exports = new PortfolioService();
