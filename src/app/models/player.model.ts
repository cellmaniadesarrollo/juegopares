export interface Player {
  id?: string;
  name: string;
  cedula: string;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface PlayerScore {
  id?: string;
  playerId: string;
  eventId: string;
  eventName: string;
  score: number;
  time: number; // en segundos
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  createdAt: Date | any;
}

export interface GameState {
  player: Player;
  eventId: string;
  startTime: Date;
  cards: GameCard[];
  moves: number;
  isGameStarted: boolean;
  isGameCompleted: boolean;
}

export interface GameCard {
  id: string;
  image: string;
  nameempresa: string;
  isFlipped: boolean;
  isMatched: boolean;
}