import { ObjectId } from 'mongodb';

import parseHexagramQueryObject from '../../../functions/libs/ParseHexagramsQueryObject';

const id = '5bf39beefb84fc0fa3e2632e';
const objectId = new ObjectId(id);
describe('ParseHexagramQueryObject', () => {
  test('Has an empty query', () => expect(parseHexagramQueryObject({})).toEqual({}));

  test('Has all 0 for queries', () => expect(parseHexagramQueryObject({
    upperId: '0', lowerId: '0', line13Id: '0', line25Id: '0', line46Id: '0',
  })).toEqual({}));

  test('Has all queries', () => expect(parseHexagramQueryObject({
    upperId: id, lowerId: id, line13Id: id, line25Id: id, line46Id: id,
  })).toEqual({
    line_13_id: objectId,
    line_25_id: objectId,
    line_46_id: objectId,
    lower_trigrams_id: objectId,
    upper_trigrams_id: objectId,
  }));
});
