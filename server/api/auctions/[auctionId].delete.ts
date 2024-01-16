import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { isInclude } from '~/server/lib/isInclude';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    userId: z.string().cuid(),
    moneyCardIds: z.array(z.number()),
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

  switch (auctionRequest.userId) {
    // turnUserからのリクエスト -> オークション確定処理
    case auction.room.turnUserId: {
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          isConfirmed: true,
        },
      });

      break;
    }
    // topUserからからのリクエスト -> 支払い処理
    case auction.topUserId: {
      const topUserMoneyCards = await prisma.userCard
        .findMany({
          where: {
            userId: auctionRequest.userId,
            card: {
              type: 'MONEY',
            },
          },
          select: {
            card: true,
          },
        })
        .catch(prismaErrorHandler);

      // お金カードを本当に持っているか確認
      if (
        !isInclude(
          topUserMoneyCards.map(({ card: { id } }) => id),
          auctionRequest.moneyCardIds,
        )
      ) {
        throw createError({
          statusCode: 400,
          message: 'The user does not have designated money cards.',
        });
      }
      // [] お金の金額が足りているか確認

      // [] topUserからお金カード削除

      // [] turnUserにお金カード付与

      // [] topUserに動物カード付与

      // [] auction削除(room.auctionIdもnullに

      // [] 次のターン(turnUserIdの更新) // ゲーム終了判定はフロントで行う

      break;
    }
    default: {
      throw createError({
        statusCode: 400,
        message: 'The user is not allowed to delete the auction.',
      });
    }
  }

  broadcastRoom(auction.room.id);
});
