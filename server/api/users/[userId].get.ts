import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.params!.userId;
  const user = await prisma.user
    .findUniqueOrThrow({
      where: {
        id: userId,
      },
    })
    .catch(prismaErrorHandler);

  return user;
});
