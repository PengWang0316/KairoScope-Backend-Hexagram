import log from '@kevinwang0316/log';
import cloudwatch from '@kevinwang0316/cloudwatch';
import mongodbHelper from '@kevinwang0316/mongodb-helper';
import {
  createClient, getAsync, setAsync, quit,
} from '@kevinwang0316/redis-helper';

import { handler } from '../../functions/fetch-hexagrams';
import parseHexagramsQueryObject from '../../functions/libs/ParseHexagramsQueryObject';

require('../helpers/initailEnvsForUnitTest');

const findReturnValue = { _id: 'testId' };
const mockFind = jest.fn().mockReturnValue(findReturnValue);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseFindResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn(), debug: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/ParseHexagramsQueryObject', () => jest.fn().mockImplementation(query => query));
jest.mock('@kevinwang0316/redis-helper', () => ({
  createClient: jest.fn(),
  getAsync: jest.fn().mockReturnValue(null),
  setAsync: jest.fn().mockReturnValue(null),
  quit: jest.fn(),
}));

describe('fetch-hexagrams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Calling without error and has query parameters', async () => {
    const event = { queryStringParameters: { id: 'id' } };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodbHelper.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(parseHexagramsQueryObject).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(findReturnValue) });
    expect(log.error).not.toHaveBeenCalled();
    expect(log.debug).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
    expect(getAsync).not.toHaveBeenCalled();
  });

  test('Calling without error and no query parameter, no cache hit', async () => {
    const event = { queryStringParameters: {} };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    // cloudwatch.trackExecTime.mockResolvedValueOnce(null);
    // cloudwatch.trackExecTime.mockResolvedValueOnce({ value: 'db value' });

    const result = await handler(event, context);

    expect(log.debug).toHaveBeenCalledTimes(2);
    expect(log.debug).toHaveBeenNthCalledWith(1, 'Fetching all hexagram, initialize the Redis client.');
    expect(log.debug).toHaveBeenNthCalledWith(2, 'Redis cache is missing.');
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(setAsync).toHaveBeenCalledTimes(1);
    expect(setAsync).toHaveBeenLastCalledWith(process.env.redisKeyAllHexagram, JSON.stringify(findReturnValue));
    expect(getAsync).toHaveBeenCalledTimes(1);
    expect(getAsync).toHaveBeenLastCalledWith(process.env.redisKeyAllHexagram);
    expect(quit).toHaveBeenCalledTimes(1);
    // FetchHexagramsFromDB function
    expect(mongodbHelper.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(parseHexagramsQueryObject).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(findReturnValue) });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Calling without error and no query parameter, cache hit', async () => {
    const event = { queryStringParameters: {} };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    // cloudwatch.trackExecTime.mockResolvedValueOnce('cache value');
    getAsync.mockReturnValueOnce('cache value');

    const result = await handler(event, context);

    expect(log.debug).toHaveBeenCalledTimes(2);
    expect(log.debug).toHaveBeenNthCalledWith(1, 'Fetching all hexagram, initialize the Redis client.');
    expect(log.debug).toHaveBeenNthCalledWith(2, 'Rdis cache hits');
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(setAsync).not.toHaveBeenCalled();
    expect(getAsync).toHaveBeenCalledTimes(1);
    expect(getAsync).toHaveBeenLastCalledWith(process.env.redisKeyAllHexagram);
    expect(quit).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(result).toEqual({ statusCode: 200, body: 'cache value' });
    // FetchHexagramsFromDB function
    expect(mongodbHelper.promiseFindResult).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockFind).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Calling with an redis fetching error', async () => {
    const event = { queryStringParameters: {} };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(2);
    expect(mongodbHelper.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(parseHexagramsQueryObject).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(findReturnValue) });
    expect(log.error).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenNthCalledWith(1, 'Redis get error: Error Message');
    expect(log.error).toHaveBeenNthCalledWith(2, 'Fallback to fetch from the database.');
    expect(log.debug).toHaveBeenCalledTimes(1);
    expect(log.debug).toHaveBeenLastCalledWith('Fetching all hexagram, initialize the Redis client.');
    expect(quit).toHaveBeenCalledTimes(1);
    expect(setAsync).not.toHaveBeenCalled();
  });

  test('Calling with an db fetching error', async () => {
    const event = { queryStringParameters: { id: 'a' } };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} function has error message: Error Message`);
    expect(createClient).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
    expect(getAsync).not.toHaveBeenCalled();
  });
});
