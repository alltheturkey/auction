import { PrismaClient } from '@prisma/client';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';

const prisma = new PrismaClient();
const runtimeConfig = useRuntimeConfig();

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
            targetUserId: true,
            targetUserAnimalUserCardIds: true,
            turnUserAnimalUserCardIds: true,
            confirmedUserId: true,
            tradeBet: {
              select: {
                userId: true,
                moneyUserCard: {
                  select: {
                    id: true,
                    card: true,
                  },
                },
              },
            },
          },
        },
      },
    })
    .catch(prismaErrorHandler);

  await fetch(new URL(`/${roomId}`, runtimeConfig.wsApi).href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(room),
  })
    .then((res) => {
      if (!res.ok) {
        throw createError({
          statusCode: 500,
          message: 'Failed to broadcast',
        });
      }
    })
    .catch((err: Error) => {
      throw createError({
        statusCode: 500,
        message: err.message,
      });
    });

  return;
};
