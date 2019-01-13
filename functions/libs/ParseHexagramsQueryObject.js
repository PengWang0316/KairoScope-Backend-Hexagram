'use strict';

const { ObjectId } = require('mongodb');

module.exports = query => {
  const queryObject = {};
  if (query.upperId && query.upperId !== '0') queryObject.upper_trigrams_id = new ObjectId(query.upperId);
  if (query.lowerId && query.lowerId !== '0') queryObject.lower_trigrams_id = new ObjectId(query.lowerId);
  if (query.line13Id && query.line13Id !== '0') queryObject.line_13_id = new ObjectId(query.line13Id);
  if (query.line25Id && query.line25Id !== '0') queryObject.line_25_id = new ObjectId(query.line25Id);
  if (query.line46Id && query.line46Id !== '0') queryObject.line_46_id = new ObjectId(query.line46Id);
  return queryObject;
};
