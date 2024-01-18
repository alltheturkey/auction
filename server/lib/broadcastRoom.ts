import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();

// [] ws serverにroom(リレーション含む)をPOSTする、responce.okでない場合はthrow createError
export const broadcastRoom = async (roomId: string) => {
  const room = await prisma.room
    .findUniqueOrThrow({
      where: { id: roomId },
      select: {
        turnUser: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            userCards: {
              select: {
                id: true,
                card: true,
              },
            },
          },
        },
        auction: {
          select: {
            topUser: {
              select: {
                id: true,
                name: true,
              },
            },
            animalCard: true,
            amount: true,
          },
        },
        trade: {
          select: {
            targetUser: {
              select: {
                id: true,
                name: true,
              },
            },
            targetUserAnimalUserCardIds: true,
            turnUserAnimalUserCardIds: true,
            tradeBet: {
              select: {
                userId: true,
                moneyCardId: true,
              },
            },
          },
        },
      },
    })
    .catch(prismaErrorHandler);

  console.log(JSON.stringify(room, null, 2));

  return room;
};
