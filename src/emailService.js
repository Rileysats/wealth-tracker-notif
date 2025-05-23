const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const stockService = require('./stockService');
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // gmail
    this.gmailUser = process.env.GMAIL_EMAIL;
    this.gmailPassword = process.env.GMAIL_PASSWORD;

    // ses
    this.sesEmail = process.env.SES_EMAIL;

    this.toEmail = process.env.USER_EMAIL;
    this.useMock = process.env.USE_MOCK_EMAIL === "true";

    this.isLocal = !Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

    this.ses = null;
    this.transporter = null;
    this.initializeEmailClient();
  }

  initializeEmailClient() {
    if (!this.useMock && this.isLocal && this.gmailPassword && this.gmailUser) { // if local mode
      try {
        console.log('Local mode - Initialising gmail transport')
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: this.gmailUser,
                pass: this.gmailPassword
            }
        })
      } catch (error) {
        console.error('Error initializing gmail transporter client:', error.message);
        this.useMock = true;
      }
    } else if (!this.useMock && !this.isLocal && this.sesEmail) { // if lambda mode
      try {
        this.ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
        console.log('SES client initialized successfully');
      } catch (error) {
        console.error('Error initializing SES client:', error.message);
        this.useMock = true;
      }
    } else {
      console.log('Mock mode enabled. Email will be simulated.');
      this.useMock = true;
    }
  }

  async formatPerformanceMessage(performanceData) {
    const { stocks, totalCurrentValue, totalValueChange, totalChangePercent, overallValueChange, overallChangePercent, date } = performanceData;

    const formattedDate = new Date(date).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `📊 Portfolio Update: ${formattedDate}`;

    let htmlMessage = `<h2>📈 Daily Stock Summary</h2><hr>`;

    // const stocksPerformance = portfolio.stocks.map(portfolioStock =>
    for (const stock of stocks) {
      let currentPrice, currentValue, overallDiff;

      currentPrice = stock.currentPrice;
      currentValue = stock.currentValue;
      overallDiff = stock.overallDiff;


      const isUp = stock.valueChange >= 0;
      const changeSymbol = isUp ? '📈' : '📉';
      const changeSign = isUp ? '+' : '';
      const color = isUp ? 'green' : 'red';

      const isUpOverall = stock.overallChange >= 0;
      const colorOverall = isUpOverall ? 'green' : 'red';
      const changeSignOverall = isUpOverall ? '+' : '';

      const stockWeighting = (currentValue / totalCurrentValue) * 100

      htmlMessage += `
        <h3>${changeSymbol} ${stock.symbol} (${stock.name})</h3>
        <p>
        <strong>Price:</strong> <span style="color:${color};">$${currentPrice.toFixed(2)} (${changeSign}${stock.changePercent.toFixed(2)}%)</span><br>
        <strong>Value:</strong> <span style="color:${color};">$${currentValue.toFixed(2)} (${changeSign}$${stock.valueChange.toFixed(2)})</span><br>
        <strong>Overall:</strong> <span style="color:${colorOverall};">$${overallDiff.toFixed(2)} (${changeSignOverall}${stock.overallChange.toFixed(2)}%)</span><br>
        <strong>Weighting:</strong>${stockWeighting.toFixed(2)}%
        </p>
      `;
    }

    const totalUp = totalValueChange >= 0;
    const totalChangeSymbol = totalUp ? '📈' : '📉';
    const totalChangeSign = totalUp ? '+' : '';
    const totalColor = totalUp ? 'green' : 'red';

    const overallUp = overallValueChange >= 0;
    const overallChangeSymbol = overallValueChange ? '📈' : '📉';
    const overallChangeSign = overallUp ? '+' : '';
    const overallColor = overallUp ? 'green' : 'red';

    htmlMessage += `
      <hr>
      <h2>📊 Portfolio Summary</h2>
      <p><strong>Total Value:</strong> $${totalCurrentValue.toFixed(2)}<br>
      <strong>Daily Change:</strong> <span style="color:${totalColor};">${totalChangeSymbol} ${totalChangeSign}$${totalValueChange.toFixed(2)} (${totalChangeSign}${totalChangePercent.toFixed(2)}%)</span><br>
      <strong>Overall Change:</strong> <span style="color:${overallColor};">${overallChangeSymbol} ${overallChangeSign}$${overallValueChange.toFixed(2)} (${totalChangeSign}${overallChangePercent.toFixed(2)}%)</span>
      </p>   
    `;

    return { subject, htmlMessage };
  }

  async sendPerformanceUpdate(performanceData) {
    try {
      const { subject, htmlMessage } = await this.formatPerformanceMessage(performanceData);

      if (this.useMock) {
        console.log('Emailer client not initialized. Message would have been:');
        console.log(htmlMessage);
        return { status: 'simulated', htmlMessage };
      } else if (this.ses) {
        console.log('Sending email from SES');
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
        Source: this.sesEmail,
      };

      await this.ses.send(new SendEmailCommand(params));

      console.log('Email sent via SES');
      return { status: 'sent', htmlMessage };

      } else if (this.transporter) {
        console.log('Sending email from nodemailer');
        const mailOptions = {
            from: this.gmailUser,
            to: this.toEmail,
            subject: subject,
            html: htmlMessage
        };

        this.transporter.sendMail(mailOptions);

        console.log(`Email sent`);
        return { status: 'sent', htmlMessage };

      } else {
        console.log("No emailer setup")
      }
    } catch (error) {
      console.error('Error sending email via SES:', error.message);
      return { status: 'error', error: error.message, htmlMessage: null };
    }
  }
}

module.exports = new EmailService();
