import { PrismaClient } from '@prisma/client/edge';
import { z } from 'zod';
import { broadcastRoom } from '../lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    roomId: z.string().cuid(),
    turnUserAnimalUserCardIds: z.array(z.number()).min(1).max(2),
    targetUserId: z.string().cuid(),
    targetUserAnimalUserCardIds: z.array(z.number()).min(1).max(2),
  });
  const tradeRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  const turnUserAnimalUserCards = await prisma.userCard
    .findMany({
      where: {
        id: {
          in: tradeRequest.turnUserAnimalUserCardIds,
        },
        card: {
          type: 'ANIMAL',
        },
      },
      include: {
        card: true,
      },
    })
    .catch(prismaErrorHandler);
  const targetUserAnimalUserCards = await prisma.userCard
    .findMany({
      where: {
        id: {
          in: tradeRequest.targetUserAnimalUserCardIds,
        },
        card: {
          type: 'ANIMAL',
        },
      },
      include: {
        card: true,
      },
    })
    .catch(prismaErrorHandler);

  if (turnUserAnimalUserCards.length !== targetUserAnimalUserCards.length) {
    throw createError({
      statusCode: 400,
      message: 'Both players must trade the same number of cards',
    });
  }

  const turnUserAnimalUserCardNames = turnUserAnimalUserCards.map(
    ({ card }) => card.name,
  );
  const targetUserAnimalUserCardNames = targetUserAnimalUserCards.map(
    ({ card }) => card.name,
  );
  const tradeAnimalCardNameSet = new Set([
    ...turnUserAnimalUserCardNames,
    ...targetUserAnimalUserCardNames,
  ]);

  if (tradeAnimalCardNameSet.size !== 1) {
    throw createError({
      statusCode: 400,
      message: 'Both players must trade the same animal',
    });
  }

  await prisma
    .$transaction(async (prisma) => {
      const trade = await prisma.trade.create({
        data: {
          targetUserId: tradeRequest.targetUserId,
          targetUserAnimalUserCardIds: targetUserAnimalUserCards.map(
            ({ id }) => id,
          ),
          turnUserAnimalUserCardIds: turnUserAnimalUserCards.map(
            ({ id }) => id,
          ),
        },
      });

      await prisma.room.update({
        where: {
          id: tradeRequest.roomId,
        },
        data: {
          auctionId: null,
          tradeId: trade.id,
        },
      });
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(tradeRequest.roomId);

  return;
});
