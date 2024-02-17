import { PrismaClient } from '@prisma/client/edge';
import { z } from 'zod';
import { broadcastRoom } from '../lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    name: z.string(),
    roomId: z.string().cuid(),
  });
  const userRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);
  const user = await prisma.user
    .create({
      data: userRequest,
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(userRequest.roomId);

  return user;
});
