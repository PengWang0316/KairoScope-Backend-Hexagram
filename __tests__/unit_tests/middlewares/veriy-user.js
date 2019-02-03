require('../../helpers/initailEnvsForUnitTest');

const verifyUser = require('../../../middlewares/verify-user');

jest.mock('@kevinwang0316/jwt-verify', () => jest.fn().mockReturnValue(false));
jest.mock('@kevinwang0316/log', () => ({ info: jest.fn() }));

describe('verity-user middleware', () => {
  test('No event.queryStringParameters and body', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    const { info } = require('@kevinwang0316/log');
    const mockNext = jest.fn();
    const mockCallback = jest.fn();

    verifyUser.before({
      event: {},
      context: { functionName: 'functionName' },
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('Has event.queryStringParameters but not jwtName', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    const { info } = require('@kevinwang0316/log');
    const mockNext = jest.fn();
    const mockCallback = jest.fn();

    verifyUser.before({
      event: { queryStringParameters: {} },
      context: { functionName: 'functionName' },
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('verify failed', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    const { info } = require('@kevinwang0316/log');
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyUser.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).toHaveBeenCalledTimes(1);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).not.toHaveBeenCalled();
    expect(context.user).toBeUndefined();
    expect(info).toHaveBeenCalledTimes(3);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('verify passed without role', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    verifyJwt.mockReturnValueOnce({ _id: 'id' });
    const log = require('@kevinwang0316/log');
    log.info = jest.fn();
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyUser.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).toHaveBeenCalledTimes(2);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: 3 });
    expect(log.info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('verify passed with role', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    verifyJwt.mockReturnValueOnce({ _id: 'id', role: '1' });
    const log = require('@kevinwang0316/log');
    log.info = jest.fn();
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyUser.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).toHaveBeenCalledTimes(3);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: '1' });
    expect(log.info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('has body verify passed with role', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    verifyJwt.mockReturnValueOnce({ _id: 'id', role: '1' });
    const log = require('@kevinwang0316/log');
    log.info = jest.fn();
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyUser.before({
      event: { body: '{ "jwtMessage": "jwtMessage" }' },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).toHaveBeenCalledTimes(4);
    expect(verifyJwt).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: '1' });
    expect(log.info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('has body verify without jwt message', () => {
    const verifyJwt = require('@kevinwang0316/jwt-verify');
    verifyJwt.mockReturnValueOnce({ _id: 'id', role: '1' });
    const log = require('@kevinwang0316/log');
    log.info = jest.fn();
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyUser.before({
      event: { body: '{}' },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verifyJwt).toHaveBeenCalledTimes(4);
    expect(mockNext).not.toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledTimes(1);
    expect(log.info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });
});
