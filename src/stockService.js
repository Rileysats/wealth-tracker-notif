const { FSx } = require('aws-sdk');
const fs = require('fs/promises');

const yahooFinance = require('yahoo-finance2').default;
yahooFinance.suppressNotices(['yahooSurvey'])
require('dotenv').config();

class StockService {
  constructor() {
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
    this.exchangeRates = {}; // { [fromCurrency]: rate }

    if (this.useMockData) {
      console.log('Using mock data (Yahoo API not used).');
    }
  }

  generateMockData(symbol) {
    const currentPrice = Math.random() * 450 + 50;
    const previousClose = currentPrice * (1 + (Math.random() * 0.1 - 0.05));
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    const currency = "AUD";

    return {
      symbol,
      currentPrice,
      previousClose,
      change,
      changePercent,
      currency
    };
  }

  async fetchExchangeRate(fromCurrency) {
    if (this.exchangeRates[fromCurrency]) {
      return Number(this.exchangeRates[fromCurrency]);
    }
    const quote = await yahooFinance.quote(`AUD${fromCurrency}=X`);
    const rate = 1 / quote.regularMarketPrice;
    this.exchangeRates[fromCurrency] = rate;

    return Number(rate);
  }

  async getStockData(symbol) {
    try {
      if (this.useMockData) {

        return this.generateMockData(symbol);
      }

      const quote = await yahooFinance.quote(symbol);
      // console.log(`Fetched data for ${symbol}:`, JSON.stringify(quote, null, 2));

      const currentPrice = quote.regularMarketPrice;
      const previousClose = quote.regularMarketPreviousClose;

      const change = quote.regularMarketChange;
      const changePercent = quote.regularMarketChangePercent;

      const name = quote.longName || quote.shortName || symbol; // Fallback to symbol if longName is not available
      

      return {
        symbol,
        currentPrice,
        previousClose,
        change,
        changePercent,
        currency: quote.currency,
        name
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

  async buyStock(ticker, quantity, price) {
    try {
      const path = "src/portfolio.json";
      const data = await fs.readFile(path, "utf8");
      
      let jsonData = JSON.parse(data);
      console.log("Parsed portfolio JSON")
      const stockToUpdate = jsonData.stocks.find(stock => stock.symbol === ticker);
      console.log(`Updating stock: ${stockToUpdate}`)
      if (!stockToUpdate) {
        throw new Error(`Stock with symbol ${ticker} not found`)
      }
      const newQuantity = stockToUpdate.quantity + quantity
      const newPrice = ((stockToUpdate.avg_buy_price * stockToUpdate.quantity) + (price * quantity)) / (newQuantity);
      
      stockToUpdate.avg_buy_price = newPrice;
      stockToUpdate.quantity = newQuantity;

      // Update lastUpdated timestamp
      jsonData.lastUpdated = new Date().toISOString();

      // Write back to JSON
      await fs.writeFile(path, JSON.stringify(jsonData, null, 2), "utf8");
      console.log(`Successfully updated ${ticker}'s price to ${newPrice}`)
      return true;

    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;
    }
  }
}

module.exports = new StockService();
