const axios = require('axios');
require('dotenv').config();

class StockService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.useMockData = !this.apiKey || this.apiKey === 'your_alpha_vantage_api_key';

    if (this.useMockData) {
      console.log('Alpha Vantage API key not configured. Using mock data.');
    }
  }

  /**
   * Generate mock stock data for testing
   * @param {string} symbol - Stock symbol
   * @returns {Object} Mock stock data
   */
  generateMockData(symbol) {
    // Generate random price between 50 and 500
    const currentPrice = Math.random() * 450 + 50;
    // Generate random previous close within 5% of current price
    const previousClose = currentPrice * (1 + (Math.random() * 0.1 - 0.05));
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol,
      currentPrice,
      previousClose,
      change,
      changePercent
    };
  }

  /**
   * Get the latest stock price and previous day's close for a given symbol
   * @param {string} symbol - Stock symbol (e.g., AAPL)
   * @returns {Promise<Object>} - Object containing current price, previous close, and change info
   */
  async getStockData(symbol) {
    try {
      // If using mock data, return mock data
      if (this.useMockData) {
        console.log(`Generating mock data for ${symbol}`);
        return this.generateMockData(symbol);
      }

      // Get daily stock data from API
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        }
      });

      const data = response.data['Global Quote'];

      if (!data || Object.keys(data).length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      // Extract relevant data
      const currentPrice = parseFloat(data['05. price']);
      const previousClose = parseFloat(data['08. previous close']);
      const change = parseFloat(data['09. change']);
      const changePercent = parseFloat(data['10. change percent'].replace('%', ''));

      return {
        symbol,
        currentPrice,
        previousClose,
        change,
        changePercent
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get stock data for multiple symbols
   * @param {Array<string>} symbols - Array of stock symbols
   * @returns {Promise<Array<Object>>} - Array of stock data objects
   */
  async getMultipleStockData(symbols) {
    try {
      const results = [];

      // If using mock data, we don't need delays
      if (this.useMockData) {
        for (const symbol of symbols) {
          const stockData = await this.getStockData(symbol);
          results.push(stockData);
        }
      } else {
        // Alpha Vantage has rate limits, so we need to add some delay between requests
        for (const symbol of symbols) {
          const stockData = await this.getStockData(symbol);
          results.push(stockData);

          // A delay to avoid hitting API rate limits (5 API calls per minute for free tier)
          if (symbols.indexOf(symbol) < symbols.length - 1) {
            console.log('Waiting 12 seconds before next API call...');
            await new Promise(resolve => setTimeout(resolve, 12000)); // 12-second delay
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error fetching multiple stock data:', error.message);
      throw error;
    }
  }
}

module.exports = new StockService();
