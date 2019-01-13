'use strict';

const cloudwatch = require('../libs/cloudwatch');

// The middleware to flush the metrics to the CloudWatch
module.exports = {
  after: (handler, next) => cloudwatch.flush().then(() => next()),
  onError: (handler, next) => cloudwatch.flush().then(() => next(handler.error)),
};
