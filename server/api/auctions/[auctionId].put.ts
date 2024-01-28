import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    topUserId: z.string().cuid(),
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

  // turnUserの場合は、currentAmountで入札(買い取り)ができるでの除外
  if (
    auctionRequest.topUserId !== room.turnUserId &&
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
        ...auctionRequest,
        isConfirmed: false,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(room.id);

  return;
});
