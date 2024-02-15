/**
 * 新しく入手したUserCardのIdを格納
 */
export const useNewUserCardIds = () => {
  return useState<Record<string, number[]>>('newUserCardIds', () => ({}));
};
