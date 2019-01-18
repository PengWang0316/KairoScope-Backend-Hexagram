'use strict';

const { ObjectId } = require('mongodb');

const verifyUser = require('../middlewares/verify-user');
const wrapper = require('../middlewares/wrapper');
const { promiseInsertResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');

const handler = async (event, context) => {console.log(event.body.hexagram);
  const { hexagram } = JSON.parse(event.body);console.log(hexagram);
  try {
    if (!context.user.role || context.user.role !== process.env.ADMINISTRATOR_ROLE * 1) throw new Error(`Invaild user ${JSON.stringify(context.user)}`);
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
