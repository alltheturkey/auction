import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll } from 'vitest';
import type { Prisma } from '@prisma/client';
import { seed } from '~/prisma/seed';

const prisma = new PrismaClient();

export const resetTable = async (
  modelNames: Prisma.ModelName[],
): Promise<void> => {
  const tablenames = modelNames.map((modelName) => ({ tablename: modelName }));

  for (const { tablename } of tablenames) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`,
    );
  }
};

export const cleanup = (modelNames: Prisma.ModelName[] = []) => {
  beforeAll(async () => {
    await resetTable(['Card', ...modelNames]);
    await seed()
      .then(async () => {
        await prisma.$disconnect();
      })
      .catch(async (err) => {
        console.error(err);
        await prisma.$disconnect();
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      });
  });
  afterAll(async () => {
    await resetTable(['Card', ...modelNames]);
    await prisma.$disconnect();
  });
};
