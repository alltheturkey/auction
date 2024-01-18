import { PrismaClient } from '@prisma/client';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { shuffleArr } from '~/server/lib/shuffleArr';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const roomId = event.context.params!.roomId;
  const { users } = await prisma.room
    .findUniqueOrThrow({
      where: { id: roomId },
      select: {
        users: {
          select: {
            id: true,
          },
        },
      },
    })
    .catch(prismaErrorHandler);

  // turnUserIdを設定
  const shuffledUsers = shuffleArr(users);
  await prisma.room
    .update({
      where: {
        id: roomId,
      },
      data: {
        turnUserId: shuffledUsers[0].id,
        auctionId: null,
        tradeId: null,
        userOrder: shuffledUsers.map(({ id }) => id),
      },
    })
    .catch(prismaErrorHandler);

  // roomに属するuserのcardを初期化
  await prisma.userCard.deleteMany({
    where: {
      userId: {
        in: users.map(({ id }) => id),
      },
    },
  });

  // userに初期お金を配る
  for (const user of users) {
    await prisma.userCard.createMany({
      data: [
        // 0: 2枚
        { userId: user.id, cardId: 1 },
        { userId: user.id, cardId: 1 },
        // 10: 4枚
        { userId: user.id, cardId: 2 },
        { userId: user.id, cardId: 2 },
        { userId: user.id, cardId: 2 },
        { userId: user.id, cardId: 2 },
        // 50: 1枚
        { userId: user.id, cardId: 3 },
      ],
    });
  }

  await broadcastRoom(roomId);

  return;
});
