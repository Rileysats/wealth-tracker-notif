const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.accountUser = process.env.GMAIL_EMAIL;
    this.accountPassword = process.env.GMAIL_PASSWORD;
    this.fromEmail = process.env.GMAIL_EMAIL;
    this.toEmail = process.env.USER_EMAIL;
    this.useMock = process.env.USE_MOCK_EMAIL === "true";

    // Initialize Twilio client only if valid credentials are provided
    this.transporter = null;
    this.initializeEmailClient();
  }

  /**
   * Initialize the Email client if valid credentials are provided
   */
  initializeEmailClient() {
    // Check if we have valid email credentials
    if (
      !this.useMock && this.accountUser && 
      this.accountPassword && this.fromEmail && this.toEmail
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

    // Create subject
    let subject = `📊 Portfolio Update: ${formattedDate}`;

    // Create message header
    let htmlMessage = `<h2>📈 Daily Stock Summary</h2><hr>`;

    // Add individual stock performance
    stocks.forEach(stock => {
      const isUp = stock.valueChange >= 0;
      const changeSymbol = isUp ? '📈' : '📉';
      const changeSign = isUp ? '+' : '';
      const color = isUp ? 'green' : 'red';

      htmlMessage += `
        <h3>${changeSymbol} ${stock.symbol} (${stock.name})</h3>
        <p><strong>Price:</strong> <span style="color:${color};">$${stock.currentPrice.toFixed(2)} (${changeSign}${stock.changePercent.toFixed(2)}%)</span><br>
        <strong>Value:</strong> <span style="color:${color};">$${stock.currentValue.toFixed(2)} (${changeSign}$${stock.valueChange.toFixed(2)})</span></p>
      `;

    });

    // Add total portfolio performance
    const totalUp = totalValueChange >= 0;
    const totalChangeSymbol = totalUp ? '📈' : '📉';
    const totalChangeSign = totalUp ? '+' : '';
    const totalColor = totalUp ? 'green' : 'red';

    htmlMessage += `
      <hr>
      <h2>📊 Portfolio Summary</h2>
      <p><strong>Total Value:</strong> $${totalCurrentValue.toFixed(2)}<br>
      <strong>Daily Change:</strong> <span style="color:${totalColor};">${totalChangeSymbol} ${totalChangeSign}$${totalValueChange.toFixed(2)} (${totalChangeSign}${totalChangePercent.toFixed(2)}%)</span></p>
    `;

    return {subject, htmlMessage};
  }

  /**
   * Send Email with portfolio performance data
   * @param {Object} performanceData - Portfolio performance data
   * @returns {Promise<Object>} - Twilio message response
   */
  async sendPerformanceUpdate(performanceData) {
    try {
      const {subject, htmlMessage} = this.formatPerformanceMessage(performanceData);

      // Check if we have a valid Twilio client
      if (!this.transporter) {
        console.log('Email transporter not initialized. Message would have been:');
        console.log(htmlMessage);
        return { status: 'simulated', htmlMessage };
      }

      try {
        // Send Email
        const mailOptions = {
            from: this.fromEmail,
            to: this.toEmail,
            subject: subject,
            html: htmlMessage
        };

        this.transporter.sendMail(mailOptions);

        console.log(`Email sent`);
        return { status: 'sent', htmlMessage };

      } catch (error) {
        console.error('Error sending Email:', error.htmlMessage);
        console.log('Message would have been:');
        console.log(htmlMessage);
        return { status: 'error', error: error.message, htmlMessage };
      }
    } catch (error) {
      console.error('Error sending Email:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();
