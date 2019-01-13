'use strict';

const { initialConnects } = require('../libs/MongoDBHelper');

module.exports = {
  before: (handler, next) => {
    initialConnects(handler.context.dbUrl, handler.context.dbName).then(() => next());
  },
};
