import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  const rooms = await prisma.room.findMany().catch(prismaErrorHandler);

  return rooms;
});
