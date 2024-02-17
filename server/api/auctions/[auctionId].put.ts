import { PrismaClient } from '@prisma/client/edge';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    topUserId: z.string().cuid().optional(),
    amount: z.number(),
  });
  const auctionRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);
  const auctionId = event.context.params!.auctionId;
  const { room, amount: currentAmount } = await prisma.auction
    .findUniqueOrThrow({
      where: {
        id: auctionId,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  if (room === null) {
    throw createError({
      statusCode: 500,
      message: 'The auction does not belong to any room.',
    });
  }

  if (
    auctionRequest.topUserId !== undefined &&
    auctionRequest.amount <= currentAmount
  ) {
    throw createError({
      statusCode: 400,
      message: 'The bet amount must be greater than the current amount.',
    });
  }

  await prisma.auction
    .update({
      where: {
        id: auctionId,
      },
      data: {
        topUserId: auctionRequest.topUserId ?? null,
        amount:
          auctionRequest.topUserId === undefined ? 0 : auctionRequest.amount,
        buyerUserId: null,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(room.id);

  return;
});
