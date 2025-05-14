const yahooFinance = require('yahoo-finance2').default;
yahooFinance.suppressNotices(['yahooSurvey'])
require('dotenv').config();

class StockService {
  constructor() {
    this.useMockData = process.env.USE_MOCK_DATA === 'true';

    if (this.useMockData) {
      console.log('Using mock data (Yahoo API not used).');
    }
  }

  generateMockData(symbol) {
    const currentPrice = Math.random() * 450 + 50;
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

  async convertUSDtoAUD(value) {
    const quote = await yahooFinance.quote('AUDUSD=X'); // USD to AUD is inverse
    
    return value * (1 / quote.regularMarketPrice);
  }

  async getStockData(symbol) {
    try {
      if (this.useMockData) {
        console.log(`Generating mock data for ${symbol}`);
        return this.generateMockData(symbol);
      }

      const quote = await yahooFinance.quote(symbol);
      // console.log('Waiting 6 seconds before next API call...');
      // await new Promise(resolve => setTimeout(resolve, 6000)); // 6-second delay

      let currentPrice, previousClose;

      if (symbol.endsWith(".AX")) {
        currentPrice = quote.regularMarketPrice;
        previousClose = quote.regularMarketPreviousClose;
      }
      else {
        currentPrice = await this.convertUSDtoAUD(quote.regularMarketPrice)
        previousClose = await this.convertUSDtoAUD(quote.regularMarketPreviousClose)
      }

      console.log(`${symbol}`)
      console.log(quote.regularMarketPrice)
      console.log(quote.regularMarketPreviousClose)
      console.log(currentPrice)
      console.log(previousClose)

      const change = quote.regularMarketChange;
      const changePercent = quote.regularMarketChangePercent;
      

      return {
        symbol,
        currentPrice,
        previousClose,
        change,
        changePercent,
      };
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error.message);
      throw error;
    }
  }

  async getMultipleStockData(symbols) {
    try {
      const results = [];

      for (const symbol of symbols) {
        const stockData = await this.getStockData(symbol);
        console.log(`${symbol}`)
        console.log(JSON.stringify(stockData));
        results.push(stockData);
      }

      return results;
    } catch (error) {
      console.error('Error fetching multiple stock data:', error.message);
      throw error;
    }
  }
}

module.exports = new StockService();
