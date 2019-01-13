import mongoSanitize from '../../../middlewares/mongo-sanitize';

jest.mock('mongo-sanitize', () => jest.fn());

describe('mongo-sanitize middleware', () => {
  test('sanitize without queryStringParameters and body', () => {
    const sanitize = require('mongo-sanitize');

    const handler = {
      event: {},
    };
    const next = jest.fn();

    mongoSanitize.before(handler, next);

    expect(sanitize).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('sanitize with queryStringParameters and body', () => {
    const sanitize = require('mongo-sanitize');

    const handler = {
      event: {
        queryStringParameters: {
          queryKey: 'queryKey',
        },
        body: {
          bodyKey: 'bodyKey',
        },
      },
    };
    const next = jest.fn();

    mongoSanitize.before(handler, next);

    expect(sanitize).toHaveBeenCalledTimes(2);
    expect(sanitize).toHaveBeenNthCalledWith(1, 'queryKey');
    expect(sanitize).toHaveBeenNthCalledWith(2, 'bodyKey');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
