import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    name: z.string(),
  });
  const userRequest = schema.parse(await readBody(event));
  const user = await prisma.user.create({
    data: userRequest,
  });

  return user;
});
