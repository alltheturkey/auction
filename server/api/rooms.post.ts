import { PrismaClient } from '@prisma/client/edge';
import { insertNameFromId } from '~/server/lib/insertNameFromId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  const room = await prisma.room
    .create({
      data: {},
    })
    .catch(prismaErrorHandler);

  return insertNameFromId(room);
});
