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
      const auction = await prisma.auction.create({
        data: {
          animalCardId: shuffleArr(deckAnimalCards)[0].id,
        },
      });

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
