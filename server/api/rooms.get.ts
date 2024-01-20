import { PrismaClient } from '@prisma/client';
import { insertNameFromId } from '~/server/lib/insertNameFromId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  // 1日以上更新されていない部屋を削除
  await prisma
    .$transaction(async (prisma) => {
      const oldRooms = await prisma.room.findMany({
        where: {
          updatedAt: {
            lt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
        },
        include: {
          users: true,
        },
      });
      await prisma.auction.deleteMany({
        where: {
          room: {
            id: {
              in: oldRooms.map((room) => room.id),
            },
          },
        },
      });
      await prisma.tradeBet.deleteMany({
        where: {
          tradeId: {
            in: oldRooms
              .map((room) => room.tradeId)
              .filter((id) => id !== null) as string[],
          },
        },
      });
      await prisma.trade.deleteMany({
        where: {
          room: {
            id: {
              in: oldRooms.map((room) => room.id),
            },
          },
        },
      });
      await prisma.userCard.deleteMany({
        where: {
          userId: {
            in: oldRooms.flatMap((room) => room.users.map((user) => user.id)),
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          roomId: {
            in: oldRooms.map((room) => room.id),
          },
        },
      });
      await prisma.room.deleteMany({
        where: {
          id: {
            in: oldRooms.map((room) => room.id),
          },
        },
      });
    })
    .catch(prismaErrorHandler);

  const rooms = await prisma.room.findMany().catch(prismaErrorHandler);

  return rooms.map((room) => insertNameFromId(room));
});
