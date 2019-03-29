import mongodbHelper from '@kevinwang0316/mongodb-helper';
import cloudwatch from '@kevinwang0316/cloudwatch';
import log from '@kevinwang0316/log';
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
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/ParseHexagramsQueryObject', () => jest.fn().mockReturnValue('mock query'));
jest.mock('@kevinwang0316/redis-helper', () => ({
  createClient: jest.fn(),
  getAsync: jest.fn(),
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
    expect(mockFind).toHaveBeenLastCalledWith('mock query');
    expect(parseHexagramsQueryObject).toHaveBeenCalledTimes(1);
    expect(parseHexagramsQueryObject).toHaveBeenLastCalledWith(event.queryStringParameters);
    expect(result).toEqual({ statusCode: 200, body: JSON.stringify(findReturnValue) });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Calling without error and no query parameter, no cache hit', () => {
    
  });

  test('Calling with an error', async () => {
    const event = { queryStringParameters: { id: 'id' } };
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
  });
});
