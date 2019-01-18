import { ObjectId } from 'mongodb';

import mongodbHelper from '../../libs/MongoDBHelper';
import cloudwatch from '../../libs/cloudwatch';
import log from '../../libs/log';
import { handler } from '../../functions/update-hexagram';

require('../helpers/initailEnvsForUnitTest');

const mockUpdateOne = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ updateOne: mockUpdateOne });

jest.mock('../../middlewares/wrapper', () => functionHandler => ({ use: () => functionHandler }));
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('update-hexagram', () => {
  beforeEach(() => {
    mongodbHelper.promiseInsertResult.mockClear();
    log.error.mockClear();
    cloudwatch.trackExecTime.mockClear();
  });

  test('Calling without error', async () => {
    const hexagram = { _id: '59613f863bbccb158d734c3d' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: 'jwtMessage' }) };
    const context = {
      user: { _id: 'id', role: 1 },
    };
    const newHexagram = { ...hexagram };
    delete newHexagram._id;

    await handler(event, context);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramsCollectionName);
    expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    expect(mockUpdateOne).toHaveBeenLastCalledWith({ _id: new ObjectId(hexagram._id) }, { $set: newHexagram });
    expect(log.error).not.toHaveBeenCalled();
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
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} function has error message: Error: Invaild user ${JSON.stringify(context.user)}`);
  });
});
