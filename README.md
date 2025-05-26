# Stock Tracker

A Node.js application that tracks your stock portfolio and sends daily SMS updates after the US stock market closes.

## Features

- Retrieves real-time stock data using yahoo-finance2
- Calculates individual stock gains/losses 
- Calculates total portfolio performance  
- Sends formatted emails updates via SES/nodemailer  
- Runs automatically on a schedule (after US market close in AEST timezone - 6:10am)  
- Configurable via environment variables  

## Prerequisites

- Node.js (v12 or higher)  
- npm  
- yahoo-finance2 (unofficial API)  
- AWS account (for deployment)  

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd stock_tracker
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

### AWS Configuration

```env
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### User Configuration

```env
SES_EMAIL=approve_ses_email
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
      "quantity": 10,
      "avg_buy_price": 110.00
    },
    {
      "symbol": "MSFT",
      "name": "Microsoft Corporation",
      "quantity": 5,
      "avg_buy_price": 200.00
    }
  ],
  "lastUpdated": "2025-05-13T00:00:00.000Z"
}
```

## Usage

### Running Locally

To run the application locally with nodemailer:

```bash
node index.js
```

### AWS Deployment

This application can be deployed to AWS using Lambda and EventBridge for scheduling.

1. Create an AWS Lambda function:
   - Runtime: Node.js 22.x  
   - Handler: `src/index.handler`  
   - Memory: 128 MB  
   - Timeout: 30 seconds  

2. Add environment variables to the Lambda function (same as in your `.env` file)

3. Run the deploy script:

```bash
sh scripts/deploy.sh
```

Or

```bash
npm run deploy
```

4. After successful deployment. Test the Lambda function using the AWS Console

## Architecture

The application consists of the following components:

- `index.js`: Main entry point and scheduler  
- `stockService.js`: Handles stock data retrieval from yahoo-finance2 API  
- `portfolioService.js`: Manages portfolio data and performance calculations  
- `emailService.js`: Formats and sends emails updates via SES/nodemailer
- `portfolio.json`: Stores user's stock holdings  

## License

MIT
