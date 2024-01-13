import type { ZodError } from 'zod';

export const zodErrorHandler = (err: ZodError) => {
  console.error(err);

  throw createError({
    statusCode: 422,
    message: err.message,
  });
};
