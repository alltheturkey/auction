import { animals, colors, uniqueNamesGenerator } from 'unique-names-generator';

export const insertNameFromId = (obj: { id: string; [key: string]: any }) => {
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
