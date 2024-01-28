/* eslint-disable @typescript-eslint/no-unsafe-assignment */ // NOTE: テスト時に `$fetch` の返却値を具体的にassertで比較するので、any型を許容する。本来はajvなどのスキーマバリデータでdecodeしてやると良い(decode時に実行時エラーを出すべきなので、 `as` は適さない。)
import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, test } from 'vitest';

describe('backendのE2Eテスト', async () => {
  await setup({
    server: true,
  });

  test('GET /api/rooms が undefined でないこと', async () => {
    const html = await $fetch('/api/rooms');
    expect(html).not.toBeUndefined();
  });
});
