import type { Room } from '@prisma/client';

/**
 * 次のターンのユーザーIDを取得
 * @param room ルーム
 */
export const getNextTurnUserId = (room: Room) => {
  const userOrder = room.userOrder;

  return userOrder[
    (userOrder.findIndex((userId) => userId === room.turnUserId) + 1) %
      userOrder.length
  ];
};
