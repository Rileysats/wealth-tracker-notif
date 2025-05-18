const portfolioService = require('./portfolioService');
const sesService = require('./SESService')
require('dotenv').config();

/**
 * Main function to get portfolio performance and send SMS update
 */
async function sendPortfolioUpdate() {
  try {
    console.log('Starting portfolio update process...');

    // Get portfolio performance data
    console.log('Fetching portfolio performance data...');
    const performanceData = await portfolioService.getPortfolioPerformance();

    // Log performance data
    console.log('Portfolio performance data:', JSON.stringify(performanceData, null, 2));

    // Send SES update
    const sesResult = await sesService.sendPerformanceUpdate(performanceData);

    console.log('Portfolio update process completed successfully.');
    return { status: 'success', sesResult };
  } catch (error) {
    console.error('Error in portfolio update process:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Run the application
 */
async function run() {
  console.log('Starting Wealth Tracker application...');

  // Check if this is a one-time run or scheduled job
  const args = process.argv.slice(2);
  const runNow = args.includes('--run-now');

  if (runNow) {
    console.log('Running portfolio update immediately...');
    await sendPortfolioUpdate();
  } else {
    console.log('Setting up scheduled job...');
    // schedulePortfolioUpdate();
    console.log('Application running. Press Ctrl+C to exit.');
  }
}

// Start the application
run().catch(error => {
  console.error('Application error:', error);
  process.exit(1);
});

// Export functions for testing or direct invocation
module.exports = {
  sendPortfolioUpdate,
  run
};
