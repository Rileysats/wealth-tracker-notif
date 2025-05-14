const { sendPortfolioUpdate } = require('./index');

/**
 * AWS Lambda handler function
 * This function will be called by AWS Lambda when triggered by EventBridge/CloudWatch Events
 *
 * @param {Object} event - AWS Lambda event object
 * @param {Object} context - AWS Lambda context object
 * @returns {Promise<Object>} - Result of the portfolio update process
 */
exports.handler = async (event, context) => {
  console.log('AWS Lambda function invoked with event:', JSON.stringify(event));

  try {
    // Run the portfolio update process
    const result = await sendPortfolioUpdate();

    console.log('Portfolio update completed successfully:', JSON.stringify(result));
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in portfolio update process:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
