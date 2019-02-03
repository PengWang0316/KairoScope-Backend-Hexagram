'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseNextResult } = require('@kevinwang0316/mongodb-helper');

const wrapper = require('../middlewares/wrapper');

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
