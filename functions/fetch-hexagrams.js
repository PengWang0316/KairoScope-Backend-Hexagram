'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseFindResult } = require('@kevinwang0316/mongodb-helper');
const redis = require('redis');
const { promisify } = require('util');

const wrapper = require('../middlewares/wrapper');
const parseHexagramsQueryObject = require('./libs/ParseHexagramsQueryObject');

/**
 * Fetching the hexagrams' data from the Database.
 * @param {object} query is an object that contains query parameters.
 * @param {string} functionName is the name of the invocation function.
 * @return {object} Return an object for Lambda response.
 */
const fetchHexagramsFromDB = async (query, functionName) => {
  try {
    const result = await cloudwatch.trackExecTime('MongoDbFindLatancy', () => promiseFindResult(db => db
      .collection(process.env.hexagramsCollectionName)
      .find(query)));
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    log.error(`${functionName} function has error message: ${error}`);
    return { statusCode: 500 };
  }
};

const handler = async (event, context) => {
  const query = parseHexagramsQueryObject(event.queryStringParameters);
  if (Object.keys(query).length === 0) {
    // Get all hexagram could be served from Redis
    log.debug('Fetching all hexagram, initialize the Redis client.');
    const client = redis.createClient({
      host: context.redisHost,
      port: context.redisPort,
      passwrod: context.redisPassword,
      no_ready_check: true,
    });
    client.auth(context.redisPassword);
    const getAsync = promisify(client.get).bind(client);
    const setAsync = promisify(client.set).bind(client);
    try {
      const cachedHexagrams = await getAsync(process.env.redisKeyAllHexagram);
      if (cachedHexagrams === null) {
        log.info('Redis cache is missing.');
        const result = await fetchHexagramsFromDB(query, context.functionName);
        await setAsync(process.env.redisKeyAllHexagram, result.body);
        client.quit();
        return result;
      }
      log.info('Rdis cache hits');
      client.quit();
      return { statusCode: 200, body: cachedHexagrams };
    } catch (err) {
      log.error(`Redis get error: ${err}`);
      log.error('Fallback to fetch from the database.');
      client.quit();
      return fetchHexagramsFromDB(query, context.functionName);
    }
  } else {
    return fetchHexagramsFromDB(query, context.functionName);
  }
};

module.exports.handler = wrapper(handler);
