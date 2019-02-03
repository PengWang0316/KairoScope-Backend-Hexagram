'use strict';

const correlationIds = require('../libs/correlation-ids');
const log = require('@kevinwang0316/log');

const captureHttp = (headers, awsRequestId, sampleDebugLogRate) => {
  if (!headers) {
    log.warn(`Request ${awsRequestId} is missing headers`);
    return;
  }

  const context = { awsRequestId };
  headers.forEach(header => {
    if (header.toLowerCase().startsWith('x-correlation-')) context[header] = headers[header];
  });

  if (!context['x-correlation-id']) {
    context['x-correlation-id'] = awsRequestId;
  }

  // forward the original User-Agent on
  if (headers['User-Agent']) {
    context['User-Agent'] = headers['User-Agent'];
  }

  if (headers['Debug-Log-Enabled']) {
    context['Debug-Log-Enabled'] = headers['Debug-Log-Enabled'];
  } else {
    context['Debug-Log-Enabled'] = Math.random() < sampleDebugLogRate ? 'true' : 'false';
  }

  correlationIds.replaceAllWith(context);
};

const isApiGatewayEvent = event => Object.prototype.hasOwnProperty.call(event, 'httpMethod');

module.exports = (config = { sampleDebugLogRate: 0.01 }) => {
  const { sampleDebugLogRate } = config;

  return {
    before: (handler, next) => {
      correlationIds.clearAll();
      if (isApiGatewayEvent(handler.event)) {
        captureHttp(handler.event.headers, handler.context.awsRequestId, sampleDebugLogRate);
      }
      next();
    },
  };
};
