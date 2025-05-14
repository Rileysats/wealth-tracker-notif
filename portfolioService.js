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

      // Calculate performance for each stock
      const stocksPerformance = portfolio.stocks.map(portfolioStock => {
        const stockData = stockDataList.find(data => data.symbol === portfolioStock.symbol);

        if (!stockData) {
          throw new Error(`No data available for symbol: ${portfolioStock.symbol}`);
        }

        const { currentPrice, previousClose, change, changePercent } = stockData;
        const quantity = portfolioStock.quantity;

        // Calculate values
        const currentValue = currentPrice * quantity;
        const previousValue = previousClose * quantity;
        const valueChange = currentValue - previousValue;

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
          valueChange
        };
      });

      // Calculate total portfolio performance
      const totalCurrentValue = stocksPerformance.reduce((sum, stock) => sum + stock.currentValue, 0);
      const totalPreviousValue = stocksPerformance.reduce((sum, stock) => sum + stock.previousValue, 0);
      const totalValueChange = totalCurrentValue - totalPreviousValue;
      const totalChangePercent = (totalValueChange / totalPreviousValue) * 100;

      return {
        stocks: stocksPerformance,
        totalCurrentValue,
        totalValueChange,
        totalChangePercent,
        date: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting portfolio performance:', error.message);
      throw error;
    }
  }
}

module.exports = new PortfolioService();
