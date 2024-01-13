import { PrismaClient } from '@prisma/client';
import { insertNameFromId } from '~/server/lib/insertNameFromId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  const rooms = await prisma.room.findMany().catch(prismaErrorHandler);

  return rooms.map((room) => insertNameFromId(room));
});
