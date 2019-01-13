import AWS from 'aws-sdk';
import Chance from 'chance';

// aws.config.region = 'us-west-2';
AWS.config.update({
  region: 'us-west-2',
  // credentials: new AWS.SharedIniFileCredentials({ profile: 'voting-profile' }), // When use the default profile, it is not needed.
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // This env will be feeded from InitialEnvs by awscred in a test environment.
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // This env will be feeded from InitialEnvs by awscred in a test environment.
});
const chance = new Chance();
const cognito = new AWS.CognitoIdentityServiceProvider();
// needs number, special char, upper and lower case
const randomPassword = () => `${chance.string({ length: 8 })}Se0!test`;

export const registerUser = () => new Promise((resolve, reject) => {
  const userpoolId = process.env.cognito_user_pool_id;
  const clientId = process.env.cognito_server_client_id;
  const firstName = chance.first();
  const lastName = chance.last();
  const username = `test-${firstName}-${lastName}-${chance.string({ length: 8 })}`;
  const password = randomPassword();
  const email = `${firstName}-${lastName}@serverlessdemo.com`;

  const createReq = { // Make a request for creating user with the Cognito pool.
    UserPoolId: userpoolId,
    Username: username,
    MessageAction: 'SUPPRESS', // Ask Cognito does not send a verify email
    TemporaryPassword: password, // Set a temporary password for using challange verification.
    UserAttributes: [ // See the Cognito setup
      { Name: 'given_name', Value: firstName },
      { Name: 'family_name', Value: lastName },
      { Name: 'email', Value: email },
    ],
  };
  cognito.adminCreateUser(createReq, async (err, result) => { // Create a user with a temporary password
    if (err) reject(err);
    const req = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH', // Customize authentication flow to SRP
      UserPoolId: userpoolId,
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };
    cognito.adminInitiateAuth(req, (err1, result1) => { // Initialize the auth flow
      if (err1) reject(err1);
      const challengeReq = {
        UserPoolId: userpoolId,
        ClientId: clientId,
        ChallengeName: result1.ChallengeName,
        Session: result1.Session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: randomPassword(),
        },
      };
      cognito.adminRespondToAuthChallenge(challengeReq, (err2, result2) => { // Response to the auth challenge
        if (err2) reject(err2);
        resolve({
          username,
          firstName,
          lastName,
          idToken: result2.AuthenticationResult.IdToken, // Get the idToken from response
        });
      });
    });
  });
});

export const deleteUser = user => new Promise((resolve, reject) => {
  const req = {
    UserPoolId: process.env.cognito_user_pool_id,
    Username: user.username,
  };

  cognito.adminDeleteUser(req, (err, result) => {
    if (err) reject(err);
    resolve(result);
  });
});
