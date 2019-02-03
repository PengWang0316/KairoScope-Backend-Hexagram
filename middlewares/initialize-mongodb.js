'use strict';

const { initialConnects } = require('@kevinwang0316/mongodb-helper');

module.exports = {
  before: (handler, next) => {
    initialConnects(handler.context.dbUrl, handler.context.dbName).then(() => next());
  },
};
