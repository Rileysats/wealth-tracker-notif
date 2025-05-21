const { FSx } = require('aws-sdk');

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

    return {
      symbol,
      currentPrice,
      previousClose,
      change,
      changePercent
    };
  }

  // async fetchExchangeRate(fromCurrency) {
  //   if (!this.exchange_rate) {
  //     const quote = await yahooFinance.quote(AUD${fromCurrency}=X);
  //     this.exchange_rate = 1 / quote.regularMarketPrice;
  //     return Number(this.exchange_rate);
  //   }
  //   else {
  //     return Number(this.exchange_rate);
  //   }
  // }

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
        console.log(`Generating mock data for ${symbol}`);
        return this.generateMockData(symbol);
      }

      const quote = await yahooFinance.quote(symbol);

      const currentPrice = quote.regularMarketPrice;
      const previousClose = quote.regularMarketPreviousClose;

      const change = quote.regularMarketChange;
      const changePercent = quote.regularMarketChangePercent;
      

      return {
        symbol,
        currentPrice,
        previousClose,
        change,
        changePercent,
        currency: quote.currency
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
      const data = await fs.readFile("portfolio.json", "utf8");
      let jsonData = JSON.parse(data);
      const stockToUpdate = jsonData.stocks.find(stock => stock.symbol === ticker);

      if (!stockToUpdate) {
        throw new Error(`Stock with symbol ${ticker} not found`)
      }
      const newQuantity = stockToUpdate.quantity + quantity
      const newPrice = ((stockToUpdate.avg_buy_price * stockToUpdate.quantity) + (price * quantity)) / (newQuantity);
      
      stockToUpdate.avg_buy_price = newPrice;
      stockToUpdate.quantity = newQuantity;

      stockToUpdate.initial_value = stockToUpdate.quantity * stockToUpdate.avg_buy_price;

      // Update lastUpdated timestamp
      jsonData.lastUpdated = new Date().toISOString();

      // Write back to JSON
      await fs.writeFile("portfolio.json", JSON.stringify(jsonData, null, 2), "utf8");
      console.log(`Successfully updated ${ticker}'s price to ${newPrice}`)
      return true;

    } catch (error) {
      console.log(`Error: ${error.message}`);
      return false;
    }
  }
}

module.exports = new StockService();
