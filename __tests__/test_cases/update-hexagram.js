import { ObjectId } from 'mongodb';

import { invokeUpdateHexagram } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';
import { getDB, initialConnects, promiseFindResult, promiseInsertResult } from '@kevinwang0316/mongodb-helper';

let context;
const hexagramId = new ObjectId();

const addOneHexagram = () => promiseInsertResult(db => db
  .collection(process.env.hexagramsCollectionName)
  .insertOne({ _id: hexagramId }));

const removeHexagram = () => getDB()
  .collection(process.env.hexagramsCollectionName)
  .deleteOne({ _id: hexagramId });

describe('update-hexagram: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
    await addOneHexagram();
  });

  afterAll(async () => {
    await removeHexagram();
  });

  test('invoke update-hexagram function', async () => {
    const hexagram = { _id: hexagramId.toString(), attrA: 'A', attrB: 'B' };
    const event = { body: JSON.stringify({ hexagram, jwtMessage: process.env.jwtRole1 }) };
    const res = await invokeUpdateHexagram(event, context);

    const result = await promiseFindResult(db => db
      .collection(process.env.hexagramsCollectionName)
      .find({ _id: hexagramId }));

    expect(res.statusCode).toBe(200);
    expect(result[0]).toEqual({ ...hexagram, _id: hexagramId });
  });
});
