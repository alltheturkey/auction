import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    userId: z.string().cuid(),
    moneyUserCardIds: z.array(z.number()),
  });
  const tradeRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  const tradeId = event.context.params!.tradeId!;
  const { room } = await prisma.trade
    .findUniqueOrThrow({
      where: {
        id: tradeId,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  if (room === null) {
    throw createError({
      statusCode: 500,
      message: 'The trade does not belong to any room.',
    });
  }

  await prisma
    .$transaction(async (prisma) => {
      // tradeBetを削除
      await prisma.tradeBet.deleteMany({
        where: {
          userId: tradeRequest.userId,
        },
      });

      const moneyUserCards = await prisma.userCard.findMany({
        where: {
          id: {
            in: tradeRequest.moneyUserCardIds,
          },
          card: {
            type: 'MONEY',
          },
        },
      });
      // tradeBetを作成
      await prisma.tradeBet.createMany({
        data: moneyUserCards.map(({ id }) => ({
          tradeId,
          userId: tradeRequest.userId,
          moneyUserCardId: id,
        })),
      });
    })
    .catch(prismaErrorHandler);

  await broadcastRoom(room.id);

  return;
});
