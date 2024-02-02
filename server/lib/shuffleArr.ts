/**
 * 配列をシャッフル
 * @param arr 配列
 */
export const shuffleArr = <T>(arr: T[]): T[] =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  (arr.map((v) => [Math.random(), v]) as [number, T][])
    .toSorted(([a], [b]) => a - b)
    .map((v) => v[1]);
