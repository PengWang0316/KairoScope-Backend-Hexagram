'use strict';

const { ObjectId } = require('mongodb');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseInsertResult } = require('@kevinwang0316/mongodb-helper');
const { verifyJWT } = require('@kevinwang0316/lambda-middlewares');
const {
  createClient, getAsync, setAsync, quit,
} = require('@kevinwang0316/redis-helper');

const wrapper = require('../middlewares/wrapper');

const updateRedis = async (redisHost, redisPort, redisPassword, newHexagram) => {
  try {
    createClient(redisHost, redisPort, redisPassword);
    const cachedHexagrams = await cloudwatch.trackExecTime('RedisGetLatency', () => getAsync(process.env.redisKeyAllHexagram));
    if (cachedHexagrams !== null) {
      const newHexagrams = JSON.parse(cachedHexagrams)
        .map(hexagram => (hexagram._id === newHexagram._id.toString() ? newHexagram : hexagram));
      await cloudwatch.trackExecTime('RedisSetLatency', () => setAsync(process.env.redisKeyAllHexagram, JSON.stringify(newHexagrams)));
    }
  } catch (err) {
    log.error(`Redis error: ${err}`);
  } finally {
    quit();
  }
};

const handler = async (event, context) => {
  const { hexagram } = JSON.parse(event.body);
  const { redisHost, redisPort, redisPassword } = context;
  try {
    if (!context.user.role || context.user.role * 1 !== process.env.ADMINISTRATOR_ROLE * 1) throw new Error(`Invaild user ${JSON.stringify(context.user)}`);
    await cloudwatch.trackExecTime('MongoDbInsertLatancy', () => promiseInsertResult(async db => {
      const newHexagram = { ...hexagram };
      delete newHexagram._id;
      const result = await db.collection(process.env.hexagramsCollectionName)
        .findOneAndUpdate({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram }, { returnOriginal: false });
      await updateRedis(redisHost, redisPort, redisPassword, result.value);
      return result;
    }));
    return { statusCode: 200 };
  } catch (error) {
    log.error(`${context.functionName} function has error message: ${error}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler).use(verifyJWT);
