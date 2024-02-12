type CardType = 'ANIMAL' | 'MONEY';

type Card = {
  id: number;
  type: CardType;
  name: string;
  img: string;
  point: number;
};

export type UserCard = {
  id: number;
  card: Card;
};

export type User = {
  id: string;
  name: string;
  userCards: UserCard[];
};

export type Room = {
  auction: {
    id: string;
    topUser: {
      id: string;
      name: string;
    } | null;
    buyerUser: {
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
    id: string;
    tradeBet: {
      moneyUserCard: UserCard;
      userId: string;
    }[];
    targetUser: {
      id: string;
      name: string;
    };
    confirmedUserId: string | null;
    targetUserAnimalUserCardIds: number[];
    turnUserAnimalUserCardIds: number[];
  } | null;
  turnUser: {
    id: string;
    name: string;
  } | null;
  users: User[];
};
