import { invokeFetchHexagramBasedOnImg } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-hexagram-based-on-img: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-hexagrams function', async () => {
    const event = { queryStringParameters: { imgArray: '7,9-7,9-7,9-6,8-7,9-6,8' } };
    const res = await invokeFetchHexagramBasedOnImg(event, context);
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toBeUndefined();
    expect(res.body).not.toBeNull();
    expect(res.body._id).toBe('59613f863bbccb158d734c29');
    expect(res.body.number).toBe(5);
    expect(Object.keys(res.body).length).toBe(38);
  });
});
