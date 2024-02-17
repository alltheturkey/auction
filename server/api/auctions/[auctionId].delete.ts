import { PrismaClient } from '@prisma/client/edge';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { getNextTurnUserId } from '~/server/lib/getNextTurnUserId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    buyerUserId: z.string().cuid(),
    moneyUserCardIds: z.array(z.number()),
  });
  const auctionRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);
  const auctionId = event.context.params!.auctionId;

  const auction = await prisma.auction
    .findUniqueOrThrow({
      where: {
        id: auctionId,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  if (auction.room === null) {
    throw createError({
      statusCode: 500,
      message: 'The auction does not belong to any room.',
    });
  }

  if (auction.buyerUserId === null) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        buyerUserId: auctionRequest.buyerUserId,
      },
    });
  } else {
    if (auction.buyerUserId !== auctionRequest.buyerUserId) {
      throw createError({
        statusCode: 400,
        message: 'You are not the buyer of this auction.',
      });
    }

    const requestMoneyUserCards = await prisma.userCard
      .findMany({
        where: {
          id: {
            in: auctionRequest.moneyUserCardIds,
          },
          card: {
            type: 'MONEY',
            // 0円カードは除外
            point: {
              not: 0,
            },
          },
        },
        include: {
          card: true,
        },
      })
      .catch(prismaErrorHandler);

    // お金が足りているか確認
    const requestMoneyAmount = requestMoneyUserCards.reduce(
      (acc, { card: { point } }) => acc + point,
      0,
    );

    if (requestMoneyAmount < auction.amount) {
      throw createError({
        statusCode: 400,
        message: 'The user does not have enough money.',
      });
    }

    await prisma
      .$transaction(async (prisma) => {
        // buyerからお金カード削除
        await prisma.userCard.deleteMany({
          where: {
            id: {
              in: requestMoneyUserCards.map(({ id }) => id),
            },
          },
        });

        // buyerでない方にお金カード付与
        await prisma.userCard.createMany({
          data: requestMoneyUserCards.map(({ cardId }) => ({
            userId:
              auction.topUserId === auctionRequest.buyerUserId
                ? auction.room!.turnUserId!
                : auction.topUserId!,
            cardId,
          })),
        });

        // buyerに動物カード付与
        await prisma.userCard.create({
          data: {
            userId: auctionRequest.buyerUserId,
            cardId: auction.animalCardId,
          },
        });

        // auction削除
        await prisma.auction.delete({
          where: {
            id: auctionId,
          },
        });

        // 次のターン
        if (auction.room) {
          await prisma.room.update({
            where: {
              id: auction.room.id,
            },
            data: {
              auctionId: null,
              tradeId: null,
              turnUserId: getNextTurnUserId(auction.room),
            },
          });
        }
      })
      .catch(prismaErrorHandler);
  }

  await broadcastRoom(auction.room.id);

  return;
});
