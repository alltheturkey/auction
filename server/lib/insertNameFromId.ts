import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

/**
 * idプロパティからnameプロパティを生成
 * @param obj オブジェクト
 */
export const insertNameFromId = <T extends { id: number | string }>(obj: T) => {
  return {
    ...obj,
    name: uniqueNamesGenerator({
      seed: obj.id,
      dictionaries: [colors, animals],
      separator: ' ',
      style: 'capital',
      length: 2,
    }),
  };
};
