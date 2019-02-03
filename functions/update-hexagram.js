'use strict';

const { ObjectId } = require('mongodb');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseInsertResult } = require('@kevinwang0316/mongodb-helper');

const wrapper = require('../middlewares/wrapper');
const verifyUser = require('../middlewares/verify-user');

const handler = async (event, context) => {
  const { hexagram } = JSON.parse(event.body);
  try {
    if (!context.user.role || context.user.role * 1 !== process.env.ADMINISTRATOR_ROLE * 1) throw new Error(`Invaild user ${JSON.stringify(context.user)}`);
    await cloudwatch.trackExecTime('MongoDbInsertLatancy', () => promiseInsertResult(db => {
      const newHexagram = { ...hexagram };
      delete newHexagram._id;
      return db.collection(process.env.hexagramsCollectionName)
        .updateOne({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram });
    }));
    return { statusCode: 200 };
  } catch (error) {
    log.error(`${context.functionName} function has error message: ${error}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler).use(verifyUser);
