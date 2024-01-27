type CardType = 'ANIMAL' | 'MONEY';

export type Room = {
  auction: {
    topUser: {
      id: string;
      name: string;
    } | null;
    animalCard: {
      id: number;
      type: CardType;
      name: string;
      img: string;
      point: number;
    };
    amount: number;
  } | null;
  trade: {
    tradeBet: {
      moneyUserCard: {
        id: number;
        card: {
          id: number;
          type: CardType;
          name: string;
          img: string;
          point: number;
        };
      };
      userId: string;
    }[];
    confirmedUserId: string | null;
    targetUserId: string;
    targetUserAnimalUserCardIds: number[];
    turnUserAnimalUserCardIds: number[];
  } | null;
  turnUser: {
    id: string;
    name: string;
  } | null;
  users: {
    id: string;
    name: string;
    userCards: {
      id: number;
      card: {
        id: number;
        type: CardType;
        name: string;
        img: string;
        point: number;
      };
    }[];
  }[];
};
