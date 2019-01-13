const jwt = require('jsonwebtoken');

const log = require('./log');

/** Verify and return user object from jwt message
 * @param { string } message includes jwt message
 * @param { string } jwtSecret contains secret key for JWT
 * @return { object } return the user object that was verified by jsonwebtoken or a false when fails to verify
 */
const verifyJWT = (message, jwtSecret) => {
  try {
    return jwt.verify(message, jwtSecret.trim()); // For some reasons, the jwtSecret comes from EC2 parameter store has spaces
  } catch (e) {
    log.info(`Verify JWT failed with message ${message}`);
    return false;
  }
};
module.exports = verifyJWT;
