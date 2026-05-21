
export interface Card {
  suit: '♠' | '♥' | '♣' | '♦';
  rank: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | '小王' | '大王';
  value: number;
  id: string;
}

export interface Player {
  id: number;
  name: string;
  isAI: boolean;
  hand: Card[];
  isLandlord: boolean;
}

export type GamePhase = 'waiting' | 'calling' | 'playing' | 'finished';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayer: number;
  landlord: number | null;
  baseScore: number;
  landlordCards: Card[];
  lastPlayedCards: Card[];
  lastPlayer: number | null;
  playerCoins: number;
  winner: number | null;
  selectedCards: Card[];
}

export type CardType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'tripleWithOne'
  | 'tripleWithTwo'
  | 'straight'
  | 'pairStraight'
  | 'plane'
  | 'planeWithWings'
  | 'fourWithTwo'
  | 'bomb'
  | 'rocket';

export interface PlayedCardInfo {
  type: CardType;
  cards: Card[];
  value: number;
}
