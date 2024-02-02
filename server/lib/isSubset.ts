/**
 * 要素ごとの出現回数を数える
 * numberの1とstringの’1’が区別されないので注意
 * @param arr stringかnumberの配列
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countElement = (arr: any[]): Record<string, number> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  arr.reduce((a, b) => ({ ...a, [b]: (a[b] ?? 0) + 1 }), {});

/**
 * subsetがsupersetに含まれているか判定
 * @param subset stringかnumberの配列
 * @param superset stringかnumberの配列
 */
export const isSubset = <T extends number | string>(
  subset: T[],
  superset: T[],
): boolean => {
  const subsetCount = countElement(subset);
  const supersetCount = countElement(superset);

  return Object.entries(subsetCount).every(
    ([element, count]) => supersetCount[element] >= count,
  );
};
