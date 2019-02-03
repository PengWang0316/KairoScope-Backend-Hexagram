'use strict';

const log = require('@kevinwang0316/log');

let start;
module.exports = {
  before: (handler, next) => {
    start = new Date().getTime();
    next();
  },
  after: (handler, next) => {
    log.debug(`MONITORING|${new Date().getTime() - start}|milliseconds|${handler.context.functionName}:${handler.context.memoryLimitInMB}|KairoScope-reading`);
    next();
  },
};
