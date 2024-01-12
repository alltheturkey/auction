import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seed = async () => {
  // お金カード
  await prisma.card.createMany({
    data: [
      { type: 'MONEY', name: '0', point: 0, img: '/img/0.webp' },
      { type: 'MONEY', name: '10', point: 10, img: '/img/10.webp' },
      { type: 'MONEY', name: '50', point: 50, img: '/img/50.webp' },
      { type: 'MONEY', name: '100', point: 100, img: '/img/100.webp' },
      { type: 'MONEY', name: '200', point: 200, img: '/img/200.webp' },
      { type: 'MONEY', name: '500', point: 500, img: '/img/500.webp' },
    ],
  });

  // 動物カード
  await prisma.card.createMany({
    data: [
      { type: 'ANIMAL', name: 'chicken', point: 10, img: '/img/chicken.webp' },
      { type: 'ANIMAL', name: 'chicken', point: 10, img: '/img/chicken.webp' },
      { type: 'ANIMAL', name: 'chicken', point: 10, img: '/img/chicken.webp' },
      { type: 'ANIMAL', name: 'chicken', point: 10, img: '/img/chicken.webp' },
      { type: 'ANIMAL', name: 'duck', point: 40, img: '/img/duck.webp' },
      { type: 'ANIMAL', name: 'duck', point: 40, img: '/img/duck.webp' },
      { type: 'ANIMAL', name: 'duck', point: 40, img: '/img/duck.webp' },
      { type: 'ANIMAL', name: 'duck', point: 40, img: '/img/duck.webp' },
      { type: 'ANIMAL', name: 'cat', point: 90, img: '/img/cat.webp' },
      { type: 'ANIMAL', name: 'cat', point: 90, img: '/img/cat.webp' },
      { type: 'ANIMAL', name: 'cat', point: 90, img: '/img/cat.webp' },
      { type: 'ANIMAL', name: 'cat', point: 90, img: '/img/cat.webp' },
      { type: 'ANIMAL', name: 'dog', point: 160, img: '/img/dog.webp' },
      { type: 'ANIMAL', name: 'dog', point: 160, img: '/img/dog.webp' },
      { type: 'ANIMAL', name: 'dog', point: 160, img: '/img/dog.webp' },
      { type: 'ANIMAL', name: 'dog', point: 160, img: '/img/dog.webp' },
      { type: 'ANIMAL', name: 'sheep', point: 250, img: '/img/sheep.webp' },
      { type: 'ANIMAL', name: 'sheep', point: 250, img: '/img/sheep.webp' },
      { type: 'ANIMAL', name: 'sheep', point: 250, img: '/img/sheep.webp' },
      { type: 'ANIMAL', name: 'sheep', point: 250, img: '/img/sheep.webp' },
      { type: 'ANIMAL', name: 'goat', point: 350, img: '/img/goat.webp' },
      { type: 'ANIMAL', name: 'goat', point: 350, img: '/img/goat.webp' },
      { type: 'ANIMAL', name: 'goat', point: 350, img: '/img/goat.webp' },
      { type: 'ANIMAL', name: 'goat', point: 350, img: '/img/goat.webp' },
      { type: 'ANIMAL', name: 'pig', point: 650, img: '/img/pig.webp' },
      { type: 'ANIMAL', name: 'pig', point: 650, img: '/img/pig.webp' },
      { type: 'ANIMAL', name: 'pig', point: 650, img: '/img/pig.webp' },
      { type: 'ANIMAL', name: 'pig', point: 650, img: '/img/pig.webp' },
      { type: 'ANIMAL', name: 'cow', point: 800, img: '/img/cow.webp' },
      { type: 'ANIMAL', name: 'cow', point: 800, img: '/img/cow.webp' },
      { type: 'ANIMAL', name: 'cow', point: 800, img: '/img/cow.webp' },
      { type: 'ANIMAL', name: 'cow', point: 800, img: '/img/cow.webp' },
      { type: 'ANIMAL', name: 'horse', point: 1000, img: '/img/horse.webp' },
      { type: 'ANIMAL', name: 'horse', point: 1000, img: '/img/horse.webp' },
      { type: 'ANIMAL', name: 'horse', point: 1000, img: '/img/horse.webp' },
      { type: 'ANIMAL', name: 'horse', point: 1000, img: '/img/horse.webp' },
    ],
  });
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
