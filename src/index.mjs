import portfolioService from './portfolioService.js';
import emailService from './emailService.js';

import { config } from 'dotenv';
config(); // Load environment variables

/**
 * Main function to get portfolio performance and send SMS update
 */
async function sendPortfolioUpdate(emailer) {
  try {
    console.log('Starting portfolio update process...');

    // Get portfolio performance data
    console.log('Fetching portfolio performance data...');
    const performanceData = await portfolioService.getPortfolioPerformance();

    // Send SES update
    const sesResult = await emailService.sendPerformanceUpdate(performanceData);

    console.log('Portfolio update process completed successfully.');
    return { status: 'success', sesResult };
  } catch (error) {
    console.error('Error in portfolio update process:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * AWS Lambda handler
 */
export async function handler(event) {
  console.log('AWS Lambda function invoked with event:', JSON.stringify(event));
  return await sendPortfolioUpdate();
}

/**
 * Local runner
 */
async function run() {
  console.log('Starting Stock Tracker application in local mode');
    await sendPortfolioUpdate();
}


if (process.argv[1] === new URL(import.meta.url).pathname) {
  run().catch(err => {
    console.error('Application error:', err);
    process.exit(1);
  });
}