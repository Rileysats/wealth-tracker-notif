# Wealth Tracker Notif

A Node.js application that tracks your stock portfolio, calculates performance, and sends daily email updates after the US stock market closes. Designed for both local use and AWS Lambda deployment.

---

## Features

- Retrieves real-time stock data using [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2)
- Calculates individual stock and total portfolio performance
- Sends formatted email updates via AWS SES (production) or Gmail (local)
- Supports both local file and S3-based portfolio storage
- Runs automatically on a schedule (after US market close, AEST timezone)
- Easily configurable via environment variables

---

## Folder Structure

```
wealth-tracker-notif/
├── infrastructure/
│   └── stack.yaml           # AWS SAM/CloudFormation template for Lambda & permissions
├── src/
│   ├── emailService.js      # Email formatting and sending (SES/nodemailer)
│   ├── index.mjs            # Main entry point (Lambda handler & local runner)
│   ├── portfolio.json       # (Local only) Example portfolio data
│   ├── portfolioService.js  # Portfolio data access & performance calculations
│   └── stockService.js      # Stock data retrieval and currency conversion
└── README.md
```

---

## Prerequisites

- Node.js (v12 or higher)
- npm
- AWS account (for deployment)
- [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) (installed via npm)

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd wealth-tracker-notif
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your details.
   ```bash
   cp .env.example .env
   ```

---

## Configuration

### AWS Configuration

Set these in your `.env` file or as Lambda environment variables:
```env
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DATA_BUCKET=your-s3-bucket-name
S3_PORTFOLIO_KEY=stocks/portfolio.json   # (optional, defaults to this value)
```

### Email Configuration

```env
SES_EMAIL=your_verified_ses_email
GMAIL_EMAIL=your_gmail_address           # (for local mode)
GMAIL_PASSWORD=your_gmail_app_password   # (for local mode)
USER_EMAIL=recipient_email_address
USE_MOCK_EMAIL=false                     # Set to true to simulate emails
```

### Portfolio Configuration

- **Local mode:** Edit `src/portfolio.json` with your holdings.
- **AWS Lambda mode:** Upload your portfolio JSON to S3 at the path specified by `S3_PORTFOLIO_KEY`.

Example portfolio JSON:
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "quantity": 10,
      "averagePrice": 110.00
    },
    {
      "symbol": "MSFT",
      "quantity": 5,
      "averagePrice": 200.00
    }
  ],
  "lastUpdated": "2025-05-13T00:00:00.000Z"
}
```

### Schedule Configuration

```env
SCHEDULE_CRON=0 8 * * 1-5
```
> This runs at 8:00 AM AEST (after US market close).

---

## Usage

### Running Locally

To run the application locally (uses Gmail for email):
```bash
node src/index.mjs
```

### AWS Deployment

1. **Build and package Lambda:**
   - Zip your code and dependencies as `stock-tracker.zip`.

2. **Deploy using AWS SAM or CloudFormation:**
   - Edit [`infrastructure/stack.yaml`](infrastructure/stack.yaml) for your schedule and bucket.
   - Deploy the stack via AWS Console or CLI.

3. **Set environment variables in Lambda** (see above).

4. **Upload your portfolio JSON to S3** at the path specified by `S3_PORTFOLIO_KEY`.

---

## Architecture

- [`src/index.mjs`](src/index.mjs): Main entry point, Lambda handler, and local runner.
- [`src/portfolioService.js`](src/portfolioService.js): Loads portfolio data (from S3 or local file), calculates performance.
- [`src/stockService.js`](src/stockService.js): Fetches stock prices and currency rates.
- [`src/emailService.js`](src/emailService.js): Formats and sends emails (SES or Gmail).
- [`infrastructure/stack.yaml`](infrastructure/stack.yaml): AWS Lambda, IAM, and EventBridge schedule.

---

## License