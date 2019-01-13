'use strict';

const sanitize = require('mongo-sanitize');

module.exports = {
  before: (handler, next) => {
    const { queryStringParameters, body } = handler.event;
    if (queryStringParameters) { // If the event has queryStringParameters, sanitzie all of the element
      const newParameters = {};
      Object.keys(queryStringParameters).forEach(key => { newParameters[key] = sanitize(queryStringParameters[key]); });
      handler.queryStringParameters = newParameters;
    }
    if (body) {
      const newBody = {};
      Object.keys(body).forEach(key => { newBody[key] = sanitize(body[key]); });
      handler.body = newBody;
    }
    next();
  },
};
