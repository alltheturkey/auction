import { PrismaClient } from '@prisma/client';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.params!.userId;
  const user = await prisma.user
    .delete({
      where: {
        id: userId,
      },
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(user.roomId);

  return;
});
