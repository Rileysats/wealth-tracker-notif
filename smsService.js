const twilio = require('twilio');
require('dotenv').config();

class SmsService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.toNumber = process.env.USER_PHONE_NUMBER;

    // Initialize Twilio client only if valid credentials are provided
    this.client = null;
    this.initializeTwilioClient();
  }

  /**
   * Initialize the Twilio client if valid credentials are provided
   */
  initializeTwilioClient() {
    // Check if we have valid Twilio credentials
    if (
      this.accountSid && this.authToken &&
      this.accountSid.startsWith('AC') &&
      this.fromNumber && this.toNumber
    ) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
        console.log('Twilio client initialized successfully');
      } catch (error) {
        console.error('Error initializing Twilio client:', error.message);
        this.client = null;
      }
    } else {
      console.log('Twilio credentials not properly configured. SMS sending will be simulated.');
    }
  }

  /**
   * Format portfolio performance data into a readable message
   * @param {Object} performanceData - Portfolio performance data
   * @returns {string} - Formatted message
   */
  formatPerformanceMessage(performanceData) {
    const { stocks, totalCurrentValue, totalValueChange, totalChangePercent, date } = performanceData;

    // Format date
    const formattedDate = new Date(date).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create message header
    let message = `📊 Portfolio Update: ${formattedDate}\n\n`;

    // Add individual stock performance
    stocks.forEach(stock => {
      const changeSymbol = stock.valueChange >= 0 ? '🔺' : '🔻';
      const changeSign = stock.valueChange >= 0 ? '+' : '';
      message += `${stock.symbol}: $${stock.currentPrice.toFixed(2)} (${changeSign}${stock.changePercent.toFixed(2)}%)\n`;
      message += `       Value: $${stock.currentValue.toFixed(2)} (${changeSign}$${stock.valueChange.toFixed(2)})\n\n`;
    });

    // Add total portfolio performance
    const totalChangeSymbol = totalValueChange >= 0 ? '🔺' : '🔻';
    const totalChangeSign = totalValueChange >= 0 ? '+' : '';
    message += `🧾 Total Portfolio Value: $${totalCurrentValue.toFixed(2)}\n`;
    message += `${totalChangeSymbol} Daily Change: ${totalChangeSign}$${totalValueChange.toFixed(2)} (${totalChangeSign}${totalChangePercent.toFixed(2)}%)\n`;

    return message;
  }

  /**
   * Send SMS with portfolio performance data
   * @param {Object} performanceData - Portfolio performance data
   * @returns {Promise<Object>} - Twilio message response
   */
  async sendPerformanceUpdate(performanceData) {
    try {
      const message = this.formatPerformanceMessage(performanceData);

      // Check if we have a valid Twilio client
      if (!this.client) {
        console.log('Twilio client not initialized. Message would have been:');
        console.log(message);
        return { status: 'simulated', message };
      }

      try {
        // Send the SMS
        const response = await this.client.messages.create({
          body: message,
          from: this.fromNumber,
          to: this.toNumber
        });

        console.log(`SMS sent with SID: ${response.sid}`);
        return { status: 'sent', sid: response.sid, message };
      } catch (error) {
        console.error('Error sending SMS via Twilio:', error.message);
        console.log('Message would have been:');
        console.log(message);
        return { status: 'error', error: error.message, message };
      }
    } catch (error) {
      console.error('Error sending SMS:', error.message);
      throw error;
    }
  }
}

module.exports = new SmsService();
