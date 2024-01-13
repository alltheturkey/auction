import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const roomId = event.context.params!.roomId;
  const room = await prisma.room
    .findUniqueOrThrow({
      where: {
        id: roomId,
      },
    })
    .catch(prismaErrorHandler);

  return room;
});
