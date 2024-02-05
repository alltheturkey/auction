/**
 * トレード用動物カード選択状態のState
 */
export const useTradeAnimalUserCardIds = () =>
  useState<Record<string, number[]>>('tradeAnimalUserCardIds', () => ({}));
