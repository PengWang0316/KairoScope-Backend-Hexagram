'use strict';

// const correlationIds = require('./correlation-ids');

const LogLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/*
 * Some information we want to include in the log
 * The full list of Lambda environment variables see here https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html
*/
// const DEFAULT_CONTEXT = {
//   awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION,
//   functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
//   functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
//   functionMemorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
//   state: process.env.ENVIRONMENT || process.env.STAGE,
// };

/*
 * Get the context from the gloab variable and put the new contexts we collect
*/
// const getContext = () => {
//   const context = correlationIds.get();
//   return context ? { ...DEFAULT_CONTEXT, ...context } : context;
// };

// default to debug if not specified
const logLevelName = () => process.env.log_level || 'DEBUG';

/**
 * Check whether should log out based on log level setting up
 * @param {number} level is a number repersents the log level
 * @return {bool} return true if should log out
 */
function isEnabled(level) {
  return level >= LogLevels[logLevelName()];
}

/**
 * Add the exception information to the original paramters
 * @param {object} params has the original values
 * @param {*} err is the execption information
 * @return {object} Return an object that includs the error information
 */
function appendError(params, err) {
  return err ? Object.assign(
    {},
    params || {},
    { errorName: err.name, errorMessage: err.message, stackTrace: err.stack },
  ) : params;
}

/**
 * Check the log level to determe whether should log out
 * @param {string} levelName a string to repersent the log level
 * @param {string} message the log message
 * @param {object} params an object to include detailed information
 * @return {null} No return
 */
function log(levelName, message, params) {
  if (!isEnabled(LogLevels[levelName])) {
    return;
  }

  const logMsg = { ...params };
  logMsg.level = levelName;
  logMsg.message = message;

  console.log(JSON.stringify(logMsg));
}

module.exports.debug = (msg, params) => log('DEBUG', msg, params);
module.exports.info = (msg, params) => log('INFO', msg, params);
module.exports.warn = (msg, params, error) => log('WARN', msg, appendError(params, error));
module.exports.error = (msg, params, error) => log('ERROR', msg, appendError(params, error));
