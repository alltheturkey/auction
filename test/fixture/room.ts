import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// NOTE: これを2つの `test()` で実行すると、並列に実行されて `id` が同じ Room が作成されてしまうので、並列に実行する場合注意
export const fixtureFixedRoom = async () => {
  await prisma.room.createMany({
    data: [
      {
        id: 'clrx5p8vc0006cxyarni2k7tv',
        updatedAt: '2024-01-28T07:05:28.873Z',
      },
      {
        id: 'clrx5p8vc0007cxyab3lzie58',
        updatedAt: '2024-01-28T07:05:28.873Z',
      },
      {
        id: 'clrx5p8vc0008cxyan3nf8ogb',
        updatedAt: '2024-01-28T07:05:28.873Z',
      },
    ],
  });
};
