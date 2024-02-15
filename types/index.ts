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
};

export type Room = {
  userOrder: string[];
  auction: {
    id: string;
    topUser: User | null;
    buyerUser: User | null;
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
    targetUser: User;
    confirmedUserId: string | null;
    targetUserAnimalUserCardIds: number[];
    turnUserAnimalUserCardIds: number[];
  } | null;
  turnUser: {
    id: string;
    name: string;
  } | null;
  users: (User & { userCards: UserCard[] })[];
};
