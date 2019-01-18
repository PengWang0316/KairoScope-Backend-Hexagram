import awscred from 'awscred';
import AWS from 'aws-sdk';

const region = 'us-west-2';
AWS.config.region = region;
const SSM = new AWS.SSM(); // Read paramters from EC2 paramter store

let isInitialized = false;

const getParameters = async keys => {
  const prefix = '/kairoscope/dev/';
  const req = { Names: keys.map(key => `${prefix}${key}`) };
  const resp = await SSM.getParameters(req).promise();
  const params = {};
  resp.Parameters.forEach(param => { params[param.Name.substr(prefix.length)] = param.Value; });
  return params;
};

const init = () => new Promise(async (resolve, reject) => {
  if (isInitialized) resolve();
  const params = await getParameters([
    'db-host',
    'db-name',
    'jwt-name',
    'jwt-secret',
    'test-jwt-key',
    'test-jwt-key-role-1',
    'hexagrams-collection-name',
  ]);
  process.env.STAGE = 'dev';
  process.env.AWS_REGION = region;
  process.env['db-host'] = params['db-host'];
  process.env['db-name'] = params['db-name'];
  process.env.jwtName = params['jwt-name'];
  process.env['jwt-secret'] = params['jwt-secret'];
  process.env.hexagramsCollectionName = params['hexagrams-collection-name'];
  process.env.jwt = params['test-jwt-key'];
  process.env.jwtRole1 = params['test-jwt-key-role-1'];
  process.env.ADMINISTRATOR_ROLE = '1';

  // User the awscred library to load credantial keys from the local profile.
  awscred.loadCredentials((err, data) => {
    if (err) reject(err);
    process.env.AWS_ACCESS_KEY_ID = data.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = data.secretAccessKey;
    // This is for the CodePipeline.
    // When we run the code there, a temporary IAM role will be used. So we have to add it as the session token.
    if (data.sessionToken) process.env.AWS_SESSION_TOKEN = data.sessionToken;
    isInitialized = true;
    resolve();
  });
});
export default init;
