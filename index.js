const schedule = require('node-schedule');
const portfolioService = require('./portfolioService');
const smsService = require('./smsService');
const emailService = require('./emailService');
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

    // Send SMS update
    // const smsResult = await smsService.sendPerformanceUpdate(performanceData);
    const smsResult = await emailService.sendPerformanceUpdate(performanceData);

    console.log('Portfolio update process completed successfully.');
    return { status: 'success', smsResult };
  } catch (error) {
    console.error('Error in portfolio update process:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Schedule the portfolio update job
 */
function schedulePortfolioUpdate() {
  const cronExpression = process.env.SCHEDULE_CRON || '0 8 * * 1-5'; // Default: 8:00 AM AEST on weekdays
  console.log(`Scheduling portfolio update job with cron expression: ${cronExpression}`);

  // Schedule the job
  const job = schedule.scheduleJob(cronExpression, async () => {
    console.log(`Running scheduled portfolio update job at ${new Date().toISOString()}`);
    await sendPortfolioUpdate();
  });

  console.log(`Job scheduled. Next run: ${job.nextInvocation()}`);
  return job;
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
    schedulePortfolioUpdate();
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
  schedulePortfolioUpdate,
  run
};
