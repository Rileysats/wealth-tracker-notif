const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
require('dotenv').config();

class SesService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL;
    this.toEmail = process.env.USER_EMAIL;
    this.useMock = process.env.USE_MOCK_EMAIL === "true";

    this.ses = null;
    this.initializeEmailClient();
  }

  initializeEmailClient() {
    if (!this.useMock && this.fromEmail && this.toEmail) {
      try {
        this.ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
        console.log('SES client initialized successfully');
      } catch (error) {
        console.error('Error initializing SES client:', error.message);
        this.ses = null;
      }
    } else {
      console.log('Email configuration missing or mock mode enabled. Email will be simulated.');
    }
  }

  formatPerformanceMessage(performanceData) {
    const { stocks, totalCurrentValue, totalValueChange, totalChangePercent, date } = performanceData;

    const formattedDate = new Date(date).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `📊 Portfolio Update: ${formattedDate}`;

    let htmlMessage = `<h2>📈 Daily Stock Summary</h2><hr>`;

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

    return { subject, htmlMessage };
  }

  async sendPerformanceUpdate(performanceData) {
    try {
      const { subject, htmlMessage } = this.formatPerformanceMessage(performanceData);

      if (!this.ses) {
        console.log('SES client not initialized. Message would have been:');
        console.log(htmlMessage);
        return { status: 'simulated', htmlMessage };
      }

      const params = {
        Destination: {
          ToAddresses: [this.toEmail],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: htmlMessage,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
        Source: this.fromEmail,
      };

      await this.ses.send(new SendEmailCommand(params));

      console.log('Email sent via SES');
      return { status: 'sent', htmlMessage };
    } catch (error) {
      console.error('Error sending email via SES:', error.message);
      return { status: 'error', error: error.message, htmlMessage: null };
    }
  }
}

module.exports = new SesService();
