# Wealth Tracker

A Node.js application that tracks your stock portfolio and sends daily SMS updates after the US stock market closes.

## Features

- Retrieves real-time stock data using Alpha Vantage API  
- Calculates individual stock gains/losses  
- Calculates total portfolio performance  
- Sends formatted SMS updates via Twilio  
- Runs automatically on a schedule (after US market close in AEST timezone)  
- Configurable via environment variables  

## Prerequisites

- Node.js (v12 or higher)  
- npm  
- Alpha Vantage API key (free tier available)  
- Twilio account (free trial available)  
- AWS account (for deployment)  

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd wealth_tracker
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables by copying the `.env.example` file to `.env` and filling in your details:

```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your specific configuration:

### API Keys

```env
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

### AWS Configuration

```env
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### Twilio Configuration

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### User Configuration

```env
USER_PHONE_NUMBER=user_phone_number
```

### Schedule Configuration

```env
SCHEDULE_CRON=0 8 * * 1-5
```

> This is set to run at 8:00 AM AEST (after US market close).

### Portfolio Configuration

Edit the `portfolio.json` file to include your stock holdings:

```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "quantity": 10
    },
    {
      "symbol": "MSFT",
      "name": "Microsoft Corporation",
      "quantity": 5
    }
  ],
  "lastUpdated": "2025-05-13T00:00:00.000Z"
}
```

## Usage

### Running Locally

To run the application locally with scheduling:

```bash
node index.js
```

To run the portfolio update immediately (without waiting for the schedule):

```bash
node index.js --run-now
```

### AWS Deployment

This application can be deployed to AWS using Lambda and EventBridge for scheduling.

1. Create an AWS Lambda function:
   - Runtime: Node.js 16.x  
   - Handler: `index.handler`  
   - Memory: 128 MB  
   - Timeout: 30 seconds  

2. Add environment variables to the Lambda function (same as in your `.env` file)

3. Create a deployment package:

```bash
zip -r wealth-tracker.zip .
```

4. Upload the deployment package to your Lambda function

5. Create an EventBridge rule to trigger the Lambda function:
   - **Schedule expression**: `cron(0 8 ? * MON-FRI *)`
   - **Target**: Your Lambda function

6. Test the Lambda function using the AWS Console

## Architecture

The application consists of the following components:

- `index.js`: Main entry point and scheduler  
- `stockService.js`: Handles stock data retrieval from Alpha Vantage API  
- `portfolioService.js`: Manages portfolio data and performance calculations  
- `smsService.js`: Formats and sends SMS updates via Twilio  
- `portfolio.json`: Stores user's stock holdings  

## License

MIT
