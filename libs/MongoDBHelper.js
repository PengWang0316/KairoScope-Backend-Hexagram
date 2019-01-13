const mongodb = require('mongodb');

const { MongoClient } = mongodb;
const log = require('./log');

var dbs; // Save dbs to a global variable for reusing

// Initializing the connection pool.
exports.initialConnects = async (dbUrl, dbName) => {
  if (!dbs) { // Initialize the database connect if dbs has not been exsit
    log.debug('Initializing a new db connection...');
    try {
      // Since every container will not interact with others, pool size should be just 1
      const client = await MongoClient.connect(dbUrl, { useNewUrlParser: true, poolSize: 1 });
      dbs = client.db(dbName);
    } catch (e) {
      log.error('Unable to connect to the mongoDB server. Error:', e);
    }
  }
};

exports.getDB = () => dbs;

/* Using Promise to wrap connection and toArray */
exports.promiseFindResult = callback => new Promise((resolve, reject) => callback(dbs)
  .toArray((err, result) => {
    if (err) reject(err);
    else resolve(result);
  }));

exports.promiseNextResult = callback => new Promise((resolve, reject) => callback(dbs)
  .next((err, result) => {
    if (err) reject(err);
    else resolve(result);
  }));

exports.promiseInsertResult = callback => new Promise((resolve, reject) => callback(dbs)
  .then(result => resolve()));

exports.promiseReturnResult = callback => new Promise((resolve, reject) => resolve(callback(dbs)));
