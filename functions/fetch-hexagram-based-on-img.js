'use strict';

const wrapper = require('../middlewares/wrapper');
const { promiseNextResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');

const handler = async (event, context) => {
  const { imgArray } = event.queryStringParameters;
  try {
    const result = await cloudwatch.trackExecTime('MongoDbFindLatancy', () => promiseNextResult(db => db
      .collection(process.env.hexagramsCollectionName)
      .find({ img_arr: imgArray })));
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    log.error(`${context.functionName} function has error message: ${error}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
