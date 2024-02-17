import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { broadcastRoom } from '~/server/lib/broadcastRoom';
import { getNextTurnUserId } from '~/server/lib/getNextTurnUserId';
import { prismaErrorHandler } from '~/server/lib/prismaErrorHandler';
import { zodErrorHandler } from '~/server/lib/zodErrorHandler';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const schema = z.object({
    userId: z.string().cuid(),
  });
  const tradeRequest = await schema
    .parseAsync(await readBody(event))
    .catch(zodErrorHandler);

  const tradeId = event.context.params!.tradeId;
  const trade = await prisma.trade
    .findUniqueOrThrow({
      where: {
        id: tradeId,
      },
      include: {
        room: true,
      },
    })
    .catch(prismaErrorHandler);

  if (trade.room === null) {
    throw createError({
      statusCode: 500,
      message: 'The trade does not belong to any room.',
    });
  }

  if (
    !(
      tradeRequest.userId === trade.targetUserId ||
      tradeRequest.userId === trade.room.turnUserId
    )
  ) {
    throw createError({
      statusCode: 400,
      message: 'You are not in this trade.',
    });
  }

  // 先に確定を押したリクエストの場合
  if (trade.confirmedUserId === null) {
    await prisma.trade
      .update({
        where: {
          id: tradeId,
        },
        data: {
          confirmedUserId: tradeRequest.userId,
        },
      })
      .catch(prismaErrorHandler);
  }
  // 後から確定を押したリクエストの場合
  else {
    await prisma
      .$transaction(async (prisma) => {
        // turnUserの掛け金取得
        const turnUserTradeBets = await prisma.tradeBet.findMany({
          where: {
            tradeId: tradeId,
            userId: trade.room!.turnUserId!,
            moneyUserCard: {
              card: {
                type: 'MONEY',
                // 0円カードは除外
                point: {
                  not: 0,
                },
              },
            },
          },
          include: {
            moneyUserCard: {
              include: {
                card: true,
              },
            },
          },
        });

        // targetUserにturnUserの掛け金を追加
        await prisma.userCard.createMany({
          data: turnUserTradeBets.map((tradeBet) => ({
            userId: trade.targetUserId,
            cardId: tradeBet.moneyUserCard.cardId,
          })),
        });

        // targetUserの掛け金取得
        const targetUserTradeBets = await prisma.tradeBet.findMany({
          where: {
            tradeId: tradeId,
            userId: trade.targetUserId,
            moneyUserCard: {
              card: {
                type: 'MONEY',
                // 0円カードは除外
                point: {
                  not: 0,
                },
              },
            },
          },
          include: {
            moneyUserCard: {
              include: {
                card: true,
              },
            },
          },
        });

        // turnUserにtargetUserの掛け金を追加
        await prisma.userCard.createMany({
          data: targetUserTradeBets.map((tradeBet) => ({
            userId: trade.room!.turnUserId!,
            cardId: tradeBet.moneyUserCard.cardId,
          })),
        });

        // 勝者判定
        const turnUserMoneyAmount = turnUserTradeBets.reduce(
          (sum, tradeBet) => sum + tradeBet.moneyUserCard.card.point,
          0,
        );
        const targetUserMoneyAmount = targetUserTradeBets.reduce(
          (sum, tradeBet) => sum + tradeBet.moneyUserCard.card.point,
          0,
        );
        const [winnerUserId, loserUserId] =
          turnUserMoneyAmount >= targetUserMoneyAmount
            ? [trade.room!.turnUserId!, trade.targetUserId]
            : [trade.targetUserId, trade.room!.turnUserId!];
        const loserAnimalUserCards = await prisma.userCard.findMany({
          where: {
            id: {
              in:
                loserUserId === trade.targetUserId
                  ? trade.targetUserAnimalUserCardIds
                  : trade.turnUserAnimalUserCardIds,
            },
            card: {
              type: 'ANIMAL',
            },
          },
          include: {
            card: true,
          },
        });

        // 勝者に敗者の動物カードを追加
        await prisma.userCard.createMany({
          data: loserAnimalUserCards.map((userCard) => ({
            userId: winnerUserId,
            cardId: userCard.card.id,
          })),
        });

        // 敗者から敗者の動物カードを削除
        await prisma.userCard.deleteMany({
          where: {
            id: {
              in: loserAnimalUserCards.map(({ id }) => id),
            },
          },
        });

        // tradeBet削除
        await prisma.tradeBet.deleteMany({
          where: {
            tradeId: tradeId,
          },
        });

        // turnUserから掛け金を削除
        await prisma.userCard.deleteMany({
          where: {
            id: {
              in: turnUserTradeBets.map((tradeBet) => tradeBet.moneyUserCardId),
            },
          },
        });

        // targetUserから掛け金を削除
        await prisma.userCard.deleteMany({
          where: {
            id: {
              in: targetUserTradeBets.map(
                (tradeBet) => tradeBet.moneyUserCardId,
              ),
            },
          },
        });

        // trade削除
        await prisma.trade.delete({
          where: {
            id: tradeId,
          },
        });

        // 次のターン
        if (trade.room) {
          await prisma.room.update({
            where: {
              id: trade.room.id,
            },
            data: {
              auctionId: null,
              tradeId: null,
              turnUserId: getNextTurnUserId(trade.room),
            },
          });
        }
      })
      .catch(prismaErrorHandler);
  }

  await broadcastRoom(trade.room.id);

  return;
});
