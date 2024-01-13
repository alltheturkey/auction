import type { Prisma } from '@prisma/client';

export const prismaErrorHandler = (
  err: Prisma.PrismaClientKnownRequestError,
) => {
<<<<<<< HEAD
=======
  console.error(err);
>>>>>>> 1668cab87ddc23934f32ef8867408ff09877afb6
  const statusCodeMap = new Map<
    Prisma.PrismaClientKnownRequestError['code'],
    number
  >([['P2025', 404]]);

  throw createError({
    statusCode: statusCodeMap.get(err.code) ?? 500,
    message: err.message,
  });
};
