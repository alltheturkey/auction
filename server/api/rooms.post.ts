import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '../lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  await prisma.room
    .create({
      data: {},
    })
    .catch(prismaErrorHandler);
  const rooms = await prisma.room.findMany().catch(prismaErrorHandler);

  return rooms;
});
