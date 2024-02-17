import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { getDeckAnimalCards } from '~/server/lib/getDeckAnimalCards';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { shuffleArr } from '~/server/lib/shuffleArr';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    roomId: z.string().cuid(),
  });
  const auctionRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  const deckAnimalCards = await getDeckAnimalCards(auctionRequest.roomId).catch(
    prismaErrorHandler,
  );

  if (deckAnimalCards.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'There are no animal cards in the deck.',
    });
  }

  await prisma
    .$transaction(async (prisma) => {
      const animalCard = shuffleArr(deckAnimalCards)[0];

      const auction = await prisma.auction.create({
        data: {
          animalCardId: animalCard.id,
        },
      });

      // ロバカードが引かれたときにお金配布
      if (animalCard.point === 500) {
        const remaining500PointAnimalCardsLength = deckAnimalCards.filter(
          ({ point }) => point === 500,
        ).length;
        let moneyCardPoint: number | undefined;

        switch (remaining500PointAnimalCardsLength) {
          case 1: {
            moneyCardPoint = 500;

            break;
          }
          case 2: {
            moneyCardPoint = 200;

            break;
          }
          case 3: {
            moneyCardPoint = 100;

            break;
          }
          default: {
            moneyCardPoint = 50;

            break;
          }
        }

        const moneyCard = await prisma.card.findFirstOrThrow({
          where: {
            type: 'MONEY',
            point: moneyCardPoint,
          },
        });

        const userIdsInRoom = await prisma.user.findMany({
          where: {
            roomId: auctionRequest.roomId,
          },
          select: {
            id: true,
          },
        });

        for (const userId of userIdsInRoom) {
          await prisma.userCard.create({
            data: {
              userId: userId.id,
              cardId: moneyCard.id,
            },
          });
        }
      }

      await prisma.room.update({
        where: {
          id: auctionRequest.roomId,
        },
        data: {
          auctionId: auction.id,
          tradeId: null,
        },
      });
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(auctionRequest.roomId);

  return;
});
