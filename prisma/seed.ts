import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const flush = async () => {
  const tablenames = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE ;`,
  );
};

/**
 * シードデータを投入
 */
export const seed = async () => {
  // お金カード
  await prisma.card.createMany({
    data: [
      {
        type: 'MONEY',
        name: 'money-0',
        point: 0,
        img: '/img/money-0.avif',
      },
      {
        type: 'MONEY',
        name: 'money-10',
        point: 10,
        img: '/img/money-10.avif',
      },
      {
        type: 'MONEY',
        name: 'money-50',
        point: 50,
        img: '/img/money-50.avif',
      },
      {
        type: 'MONEY',
        name: 'money-100',
        point: 100,
        img: '/img/money-100.avif',
      },
      {
        type: 'MONEY',
        name: 'money-200',
        point: 200,
        img: '/img/money-200.avif',
      },
      {
        type: 'MONEY',
        name: 'money-500',
        point: 500,
        img: '/img/money-500.avif',
      },
    ],
  });

  // 動物カード
  await prisma.card.createMany({
    data: [
      {
        type: 'ANIMAL',
        name: 'animal-10',
        point: 10,
        img: '/img/animal-10.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-10',
        point: 10,
        img: '/img/animal-10.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-10',
        point: 10,
        img: '/img/animal-10.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-10',
        point: 10,
        img: '/img/animal-10.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-40',
        point: 40,
        img: '/img/animal-40.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-40',
        point: 40,
        img: '/img/animal-40.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-40',
        point: 40,
        img: '/img/animal-40.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-40',
        point: 40,
        img: '/img/animal-40.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-90',
        point: 90,
        img: '/img/animal-90.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-90',
        point: 90,
        img: '/img/animal-90.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-90',
        point: 90,
        img: '/img/animal-90.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-90',
        point: 90,
        img: '/img/animal-90.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-160',
        point: 160,
        img: '/img/animal-160.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-160',
        point: 160,
        img: '/img/animal-160.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-160',
        point: 160,
        img: '/img/animal-160.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-160',
        point: 160,
        img: '/img/animal-160.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-250',
        point: 250,
        img: '/img/animal-250.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-250',
        point: 250,
        img: '/img/animal-250.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-250',
        point: 250,
        img: '/img/animal-250.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-250',
        point: 250,
        img: '/img/animal-250.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-350',
        point: 350,
        img: '/img/animal-350.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-350',
        point: 350,
        img: '/img/animal-350.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-350',
        point: 350,
        img: '/img/animal-350.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-350',
        point: 350,
        img: '/img/animal-350.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-650',
        point: 650,
        img: '/img/animal-650.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-650',
        point: 650,
        img: '/img/animal-650.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-650',
        point: 650,
        img: '/img/animal-650.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-650',
        point: 650,
        img: '/img/animal-650.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-800',
        point: 800,
        img: '/img/animal-800.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-800',
        point: 800,
        img: '/img/animal-800.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-800',
        point: 800,
        img: '/img/animal-800.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-800',
        point: 800,
        img: '/img/animal-800.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-1000',
        point: 1000,
        img: '/img/animal-1000.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-1000',
        point: 1000,
        img: '/img/animal-1000.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-1000',
        point: 1000,
        img: '/img/animal-1000.avif',
      },
      {
        type: 'ANIMAL',
        name: 'animal-1000',
        point: 1000,
        img: '/img/animal-1000.avif',
      },
    ],
  });
};

await flush();
seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
