import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 山札の動物カードを取得
 */
export const getDeckAnimalCards = async (roomId: string) => {
  const room = await prisma.room.findUniqueOrThrow({
    where: {
      id: roomId,
    },
    select: {
      users: {
        select: {
          userCards: {
            where: {
              card: {
                type: 'ANIMAL',
              },
            },
            select: {
              card: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const usersAnimalCardIds = room.users.flatMap((user) =>
    user.userCards.flatMap(({ card: { id } }) => id),
  );

  const deckAnimalCards = await prisma.card.findMany({
    where: {
      id: {
        notIn: usersAnimalCardIds,
      },
      type: 'ANIMAL',
    },
  });

  return deckAnimalCards;
};
