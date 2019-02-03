'use strict';

const cloudwatch = require('@kevinwang0316/cloudwatch');

// The middleware to flush the metrics to the CloudWatch
module.exports = {
  after: (handler, next) => cloudwatch.flush().then(() => next()),
  onError: (handler, next) => cloudwatch.flush().then(() => next(handler.error)),
};
