const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.accountUser = process.env.GMAIL_EMAIL;
    this.accountPassword = process.env.GMAIL_PASSWORD;
    this.fromEmail = process.env.GMAIL_EMAIL;
    this.toEmail = process.env.USER_EMAIL;

    // Initialize Twilio client only if valid credentials are provided
    this.transporter = null;
    this.initializeTwilioClient();
  }

  /**
   * Initialize the Twilio client if valid credentials are provided
   */
  initializeTwilioClient() {
    // Check if we have valid Twilio credentials
    if (
      this.accountUser && this.accountPassword &&
      this.fromEmail && this.toEmail
    ) {
      try {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.accountUser,
                pass: this.accountPassword
            }
        })
        console.log('Email transporter initialized successfully');
      } catch (error) {
        console.error('Error initializing email transporter:', error.message);
        this.transporter = null;
      }
    } else {
      console.log('Email credentials not properly configured. Email will be simulated.');
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
      if (!this.transporter) {
        console.log('Email transporter not initialized. Message would have been:');
        console.log(message);
        return { status: 'simulated', message };
      }

      try {
        // Send the SMS
        // const response = await this.client.messages.create({
        //   body: message,
        //   from: this.fromNumber,
        //   to: this.toNumber
        // });

        const mailOptions = {
            from: this.fromEmail,
            to: this.toEmail,
            subject: "Daily Stock Tracker",
            text: message
        };

        this.transporter.sendMail(mailOptions);

        console.log(`Email sent`);
        return { status: 'sent', message };

      } catch (error) {
        console.error('Error sending Email:', error.message);
        console.log('Message would have been:');
        console.log(message);
        return { status: 'error', error: error.message, message };
      }
    } catch (error) {
      console.error('Error sending Email:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();
