/**
 * 要素ごとの出現回数を数える
 * numberの1とstringの’1’が区別されないので注意
 */
const countElement = (arr: any[]): Record<string, number> =>
  arr.reduce((a, b) => ({ ...a, [b]: (a[b] ?? 0) + 1 }), {});

/**
 * subsetがsupersetに含まれているか判定
 */
export const isSubset = <T extends number | string>(
  subset: T[],
  superset: T[],
): Boolean => {
  const subsetCount = countElement(subset);
  const supersetCount = countElement(superset);

  return Object.entries(subsetCount).every(
    ([element, count]) => supersetCount[element] >= count,
  );
};
