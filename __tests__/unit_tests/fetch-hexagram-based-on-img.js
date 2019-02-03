import mongodbHelper from '@kevinwang0316/mongodb-helper';
import cloudwatch from '@kevinwang0316/cloudwatch';
import log from '@kevinwang0316/log';
import { handler } from '../../functions/fetch-hexagram-based-on-img';

require('../helpers/initailEnvsForUnitTest');

const findReturnValue = { _id: 'testId' };
const mockFind = jest.fn().mockReturnValue(findReturnValue);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseNextResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-hexagrams', () => {
  beforeEach(() => {
    mongodbHelper.promiseNextResult.mockClear();
    log.error.mockClear();
    cloudwatch.trackExecTime.mockClear();
  });

  test('Calling without error', async () => {
    const event = { queryStringParameters: { imgArray: 'imgArray' } };
    const context = {};

    const result = await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodbHelper.promiseNextResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ img_arr: event.queryStringParameters.imgArray });
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
