import { ObjectId } from 'mongodb';

import mongodbHelper from '@kevinwang0316/mongodb-helper';
import cloudwatch from '@kevinwang0316/cloudwatch';
import log from '@kevinwang0316/log';
import {
  createClient, getAsync, setAsync, quit,
} from '@kevinwang0316/redis-helper';

import { handler } from '../../functions/update-hexagram';

require('../helpers/initailEnvsForUnitTest');

const mockReturnValue = { value: { _id: '2', value: 'newValue' } };
const mockFindOneAndUpdate = jest.fn().mockReturnValue(mockReturnValue);
const mockCollection = jest.fn().mockReturnValue({ findOneAndUpdate: mockFindOneAndUpdate });

jest.mock('../../middlewares/wrapper', () => functionHandler => ({ use: () => functionHandler }));
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('@kevinwang0316/redis-helper', () => ({
  createClient: jest.fn(),
  getAsync: jest.fn().mockReturnValue(null),
  setAsync: jest.fn().mockReturnValue(null),
  quit: jest.fn(),
}));

describe('update-hexagram', () => {
  beforeEach(() => jest.clearAllMocks());

  test('Calling without error and Redis cache', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    const newHexagram = { ...hexagram };
    delete newHexagram._id;

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(3);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram }, { returnOriginal: false });
    expect(log.error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
    // For updateRedis function
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(getAsync).toHaveBeenCalledTimes(2);
    expect(getAsync).toHaveBeenNthCalledWith(1, process.env.redisKeyAllHexagram);
    expect(getAsync).toHaveBeenNthCalledWith(2, process.env.redisKeyHexagrams);
    expect(setAsync).not.toHaveBeenCalled();
    expect(quit).toHaveBeenCalledTimes(1);
  });

  test('Calling without error but has Redis cache for allHexagram', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    const newHexagram = { ...hexagram };
    delete newHexagram._id;
    const mockCacheValue = [{ _id: '1', value: 'value1' }, { _id: '2', value: 'value2' }];
    getAsync.mockReturnValueOnce(JSON.stringify(mockCacheValue));

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(4);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram }, { returnOriginal: false });
    expect(log.error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
    // For updateRedis function
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(getAsync).toHaveBeenCalledTimes(2);
    expect(getAsync).toHaveBeenNthCalledWith(1, process.env.redisKeyAllHexagram);
    expect(getAsync).toHaveBeenNthCalledWith(2, process.env.redisKeyHexagrams);
    expect(setAsync).toHaveBeenCalledTimes(1);
    expect(setAsync).toHaveBeenLastCalledWith(process.env.redisKeyAllHexagram, JSON.stringify([mockCacheValue[0], mockReturnValue.value]));
    expect(quit).toHaveBeenCalledTimes(1);
  });

  test('Calling without error but has Redis cache for hexagrams', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    const newHexagram = { ...hexagram };
    delete newHexagram._id;
    const mockCacheValue = [{ _id: '1', value: 'value1' }, { _id: '2', value: 'value2' }];
    getAsync.mockReturnValueOnce(null);
    getAsync.mockReturnValueOnce(JSON.stringify(mockCacheValue));

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(4);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram }, { returnOriginal: false });
    expect(log.error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
    // For updateRedis function
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(getAsync).toHaveBeenCalledTimes(2);
    expect(getAsync).toHaveBeenNthCalledWith(1, process.env.redisKeyAllHexagram);
    expect(getAsync).toHaveBeenNthCalledWith(2, process.env.redisKeyHexagrams);
    expect(setAsync).toHaveBeenCalledTimes(1);
    expect(setAsync).toHaveBeenLastCalledWith(process.env.redisKeyHexagrams, JSON.stringify(mockCacheValue));
    expect(quit).toHaveBeenCalledTimes(1);
  });
  
  test('Calling without error but has Redis cache for allHexagram and hexagrams', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      redisHost: 'host',
      redisPort: 'port',
      redisPassword: 'pw',
    };
    const newHexagram = { ...hexagram };
    delete newHexagram._id;
    const mockCacheValue = [{ _id: '1', value: 'value1' }, { _id: '2', value: 'value2' }];
    getAsync.mockReturnValueOnce(JSON.stringify(mockCacheValue));
    getAsync.mockReturnValueOnce(JSON.stringify(mockCacheValue));

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(5);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenLastCalledWith({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram }, { returnOriginal: false });
    expect(log.error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
    // For updateRedis function
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenLastCalledWith(context.redisHost, context.redisPort, context.redisPassword);
    expect(getAsync).toHaveBeenCalledTimes(2);
    expect(getAsync).toHaveBeenNthCalledWith(1, process.env.redisKeyAllHexagram);
    expect(getAsync).toHaveBeenNthCalledWith(2, process.env.redisKeyHexagrams);
    expect(setAsync).toHaveBeenCalledTimes(2);
    expect(setAsync).toHaveBeenNthCalledWith(1, process.env.redisKeyAllHexagram, JSON.stringify([mockCacheValue[0], mockReturnValue.value]));
    expect(setAsync).toHaveBeenNthCalledWith(2, process.env.redisKeyHexagrams, JSON.stringify(mockCacheValue));
    expect(quit).toHaveBeenCalledTimes(1);
  });

  test('Calling with a Redis error', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      functionName: 'functionName',
    };
    createClient.mockImplementationOnce(() => {
      throw Error('Error Message');
    });

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ statusCode: 200 });
    expect(getAsync).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
    expect(quit).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith('Redis error: Error: Error Message');
  });

  test('Calling with a database error', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
      functionName: 'functionName',
    };
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(getAsync).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} function has error message: Error Message`);
  });

  test('Calling with a user role error', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 3 },
      functionName: 'functionName',
    };

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 500 });
    expect(createClient).not.toHaveBeenCalled();
    expect(getAsync).not.toHaveBeenCalled();
    expect(setAsync).not.toHaveBeenCalled();
    expect(quit).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} function has error message: Error: Invaild user ${JSON.stringify(context.user)}`);
  });
});
