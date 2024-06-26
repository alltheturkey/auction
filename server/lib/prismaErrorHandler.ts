import type { Prisma } from '@prisma/client';

/**
 * Prismaエラーハンドラ
 * @param err Prismaエラーオブジェクト
 */
export const prismaErrorHandler = (
  err: Prisma.PrismaClientKnownRequestError,
) => {
  console.error(err);
  const statusCodeMap = new Map<
    Prisma.PrismaClientKnownRequestError['code'],
    number
  >([['P2025', 404]]);

  throw createError({
    statusCode: statusCodeMap.get(err.code) ?? 500,
    message: err.message,
  });
};
