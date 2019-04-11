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
    const cachedHexagrams = await Promise.all([
      cloudwatch.trackExecTime('RedisGetLatency', () => getAsync(process.env.redisKeyAllHexagram)),
      cloudwatch.trackExecTime('RedisGetLatency', () => getAsync(process.env.redisKeyHexagrams)),
    ]);

    const setPromises = [];
    // Update the allHexagrams cache
    if (cachedHexagrams[0] !== null) {
      const newHexagrams = JSON.parse(cachedHexagrams[0])
        .map(hexagram => (hexagram._id === newHexagram._id.toString() ? newHexagram : hexagram));
      setPromises.push(cloudwatch.trackExecTime('RedisSetLatency', () => setAsync(process.env.redisKeyAllHexagram, JSON.stringify(newHexagrams))));
    }
    // Update the hexagrams cache
    if (cachedHexagrams[1] !== null) {
      const newHexagrams = JSON.parse(cachedHexagrams[1]);
      newHexagrams[newHexagram.img_arr] = newHexagram;
      setPromises.push(cloudwatch.trackExecTime('RedisSetLatency', () => setAsync(process.env.redisKeyHexagrams, JSON.stringify(newHexagrams))));
    }
    await Promise.all(setPromises);
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
