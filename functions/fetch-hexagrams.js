'use strict';

const wrapper = require('../middlewares/wrapper');
const { promiseFindResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');
const parseHexagramsQueryObject = require('./libs/ParseHexagramsQueryObject');

const handler = async (event, context) => {
  const query = parseHexagramsQueryObject(event.queryStringParameters);
  try {
    const result = await cloudwatch.trackExecTime('', () => promiseFindResult(db => db
      .collection(process.env.hexagramsCollectionName)
      .find(query)));
    return { statusCode: 200, body: JSON.parse(result) };
  } catch (error) {
    log.error(`${context.functionName} function has error message: ${error}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
