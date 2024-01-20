import { PrismaClient } from '@prisma/client';
import type { Room } from '@prisma/client';

const prisma = new PrismaClient();

export const nextTurn = async (room: Room) => {
  const userOrder = room.userOrder;
  const nextTurnUserId =
    userOrder[
      (userOrder.findIndex((userId) => userId === room.turnUserId) + 1) %
        userOrder.length
    ];
  await prisma.room.update({
    where: {
      id: room.id,
    },
    data: {
      auctionId: null,
      tradeId: null,
      turnUserId: nextTurnUserId,
    },
  });
};
