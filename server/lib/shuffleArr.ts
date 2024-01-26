export const shuffleArr = <T>(arr: T[]): T[] =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  (arr.map((v) => [Math.random(), v]) as [number, T][])
    .sort(([a], [b]) => a - b)
    .map((v) => v[1]);
