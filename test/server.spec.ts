/* eslint-disable @typescript-eslint/no-unsafe-assignment */ // NOTE: テスト時に `$fetch` の返却値を具体的にassertで比較するので、any型を許容する。本来はajvなどのスキーマバリデータでdecodeしてやると良い(decode時に実行時エラーを出すべきなので、 `as` は適さない。)
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, test } from 'vitest';
import { fixtureRoom } from './fixture/room';
import { cleanup } from './util/reset';

describe('backendのE2Eテスト', async () => {
  await setup({
    server: true,
  });
  cleanup(['Room']);

  test('GET /api/rooms が fixtureで作ったデータ から期待される返り値を返すこと', async () => {
    await fixtureRoom();
    const rooms = await $fetch('/api/rooms');
    expect(rooms).toStrictEqual([
      {
        auctionId: null,
        id: 'clrx5p8vc0006cxyarni2k7tv',
        name: 'Pink Elephant',
        tradeId: null,
        turnUserId: null,
        updatedAt: '2024-01-28T07:05:28.873Z',
        userOrder: [],
        users: [],
      },
      {
        auctionId: null,
        id: 'clrx5p8vc0007cxyab3lzie58',
        name: 'Black Guanaco',
        tradeId: null,
        turnUserId: null,
        updatedAt: '2024-01-28T07:05:28.873Z',
        userOrder: [],
        users: [],
      },
      {
        auctionId: null,
        id: 'clrx5p8vc0008cxyan3nf8ogb',
        name: 'Aqua Thrush',
        tradeId: null,
        turnUserId: null,
        updatedAt: '2024-01-28T07:05:28.873Z',
        userOrder: [],
        users: [],
      },
    ]);
  });
});
