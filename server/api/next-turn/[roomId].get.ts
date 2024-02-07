import { PrismaClient } from '@prisma/client';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { getNextTurnUserId } from '~/server/lib/getNextTurnUserId';
import { insertNameFromId } from '~/server/lib/insertNameFromId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const roomId = event.context.params!.roomId;
  const room = await prisma.room
    .findUniqueOrThrow({
      where: {
        id: roomId,
      },
      include: {
        users: true,
      },
    })
    .catch(prismaErrorHandler);

  await prisma.room
    .update({
      where: {
        id: room.id,
      },
      data: {
        auctionId: null,
        tradeId: null,
        turnUserId: getNextTurnUserId(room),
      },
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(roomId);

  return insertNameFromId(room);
});
