/**
 * 要素ごとの出現回数を数える
 * numberの1とstringの’1’が区別されないので注意
 */
const countElement = (arr: any[]): Record<string, number> =>
  arr.reduce((a, b) => ({ ...a, [b]: (a[b] ?? 0) + 1 }), {});

/**
 * sourceArrにtargetArrが含まれているかどうかを判定
 */
export const isInclude = <T extends number | string>(
  sourceArr: T[],
  targetArr: T[],
): Boolean => {
  const sourceArrCount = countElement(sourceArr);
  const targetArrCount = countElement(targetArr);

  return Object.entries(targetArrCount).every(
    ([element, count]) => sourceArrCount[element] >= count,
  );
};
