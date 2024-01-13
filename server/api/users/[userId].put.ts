import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const userId = event.context.params!.userId;
  const schema = z.object({
    name: z.string().optional(),
    roomId: z.string().optional(),
  });
  const userRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);
  const user = await prisma.user
    .update({
      where: {
        id: userId,
      },
      data: userRequest,
    })
    .catch(prismaErrorHandler);

  return user;
});
