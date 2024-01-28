import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const fixtureRoom = async () => {
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
