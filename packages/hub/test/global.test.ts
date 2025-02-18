/* eslint-disable deprecation/deprecation */

import { GLOBAL_OBJ } from '@sentry/utils';

import { Hub, getCurrentHub, getHubFromCarrier } from '../src';

describe('global', () => {
  test('getGlobalHub', () => {
    expect(getCurrentHub()).toBeTruthy();
    expect(GLOBAL_OBJ.__SENTRY__.hub).toBeTruthy();
  });

  test('getHubFromCarrier', () => {
    const bla = { a: 'b' };
    getHubFromCarrier(bla as any);
    expect((bla as any).__SENTRY__.hub).toBeTruthy();
    expect((bla as any).__SENTRY__.hub).toBe((bla as any).__SENTRY__.hub);
    getHubFromCarrier(bla as any);
  });

  test('getGlobalHub', () => {
    const newestHub = new Hub(undefined, undefined, undefined, 999999);
    GLOBAL_OBJ.__SENTRY__.hub = newestHub;
    expect(getCurrentHub()).toBe(newestHub);
  });

  test('hub extension methods receive correct hub instance', () => {
    const newestHub = new Hub(undefined, undefined, undefined, 999999);
    GLOBAL_OBJ.__SENTRY__.hub = newestHub;
    const fn = jest.fn().mockImplementation(function (...args: []) {
      // @ts-expect-error typescript complains that this can be `any`
      expect(this).toBe(newestHub);
      expect(args).toEqual([1, 2, 3]);
    });
    GLOBAL_OBJ.__SENTRY__.extensions = {};
    GLOBAL_OBJ.__SENTRY__.extensions.testy = fn;
    (getCurrentHub() as any)._callExtensionMethod('testy', 1, 2, 3);
    expect(fn).toBeCalled();
  });
});
