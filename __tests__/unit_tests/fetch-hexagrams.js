import mongodbHelper from '../../libs/MongoDBHelper';
import cloudwatch from '../../libs/cloudwatch';
import log from '../../libs/log';
import { handler } from '../../functions/fetch-hexagrams';
import parseHexagramsQueryObject from '../../functions/libs/ParseHexagramsQueryObject';

require('../helpers/initailEnvsForUnitTest');

const findReturnValue = { _id: 'testId' };
const mockFind = jest.fn().mockReturnValue(findReturnValue);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseFindResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('../../functions/libs/ParseHexagramsQueryObject', () => jest.fn().mockReturnValue('mock query'));

describe('fetch-hexagrams', () => {
  beforeEach(() => {
    mongodbHelper.promiseFindResult.mockClear();
    log.error.mockClear();
    cloudwatch.trackExecTime.mockClear();
    parseHexagramsQueryObject.mockClear();
  });

  test('Calling without error', async () => {
    const event = { queryStringParameters: { id: 'id' } };
    const context = {
      user: { _id: 'id' },
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
