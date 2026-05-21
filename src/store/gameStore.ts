
import { create } from 'zustand';
import { GameState, Card } from '../types';
import { createDeck, dealCards, identifyCardType, compareCards } from '../utils/gameLogic';
import { aiCallLandlord, aiPlayCards } from '../utils/aiLogic';

interface GameStore {
  gameState: GameState;
  startGame: () => void;
  callLandlord: (call: boolean) => void;
  selectCard: (card: Card) => void;
  playCards: () => void;
  pass: () => void;
}

const initialState: GameState = {
  phase: 'waiting',
  players: [
    { id: 0, name: '玩家', isAI: false, hand: [], isLandlord: false },
    { id: 1, name: '电脑1', isAI: true, hand: [], isLandlord: false },
    { id: 2, name: '电脑2', isAI: true, hand: [], isLandlord: false },
  ],
  currentPlayer: 0,
  landlord: null,
  baseScore: 1,
  landlordCards: [],
  lastPlayedCards: [],
  lastPlayer: null,
  playerCoins: 1000,
  winner: null,
  selectedCards: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialState,
  
  startGame: () => {
    const deck = createDeck();
    const { hands, landlordCards } = dealCards(deck);
    
    set((state) => ({
      gameState: {
        ...initialState,
        phase: 'calling',
        players: state.gameState.players.map((player, index) => ({
          ...player,
          hand: hands[index],
          isLandlord: false,
        })),
        landlordCards,
        currentPlayer: 0,
        playerCoins: state.gameState.playerCoins,
      },
    }));
    
    setTimeout(() => {
      const { gameState } = get();
      if (gameState.players[0].isAI) {
        handleAICallLandlord(get, set);
      }
    }, 1000);
  },
  
  callLandlord: (call: boolean) => {
    set((state) => {
      const newState = { ...state.gameState };
      
      if (call) {
        if (newState.baseScore < 3) {
          newState.baseScore++;
          newState.currentPlayer = (newState.currentPlayer + 1) % 3;
          
          setTimeout(() => {
            const { gameState: currentState } = get();
            if (currentState.players[currentState.currentPlayer].isAI) {
              handleAICallLandlord(get, set);
            }
          }, 1000);
        } else {
          newState.landlord = newState.currentPlayer;
          newState.phase = 'playing';
          newState.players[newState.currentPlayer].hand.push(...newState.landlordCards);
          newState.players[newState.currentPlayer].isLandlord = true;
        }
      } else {
        if (newState.landlord !== null) {
          newState.phase = 'playing';
          newState.players[newState.landlord].hand.push(...newState.landlordCards);
          newState.players[newState.landlord].isLandlord = true;
        } else {
          newState.currentPlayer = (newState.currentPlayer + 1) % 3;
          
          if (newState.currentPlayer === 0) {
            setTimeout(() => {
              const { startGame } = get();
              startGame();
            }, 500);
            return state;
          }
          
          setTimeout(() => {
            const { gameState: currentState } = get();
            if (currentState.players[currentState.currentPlayer].isAI) {
              handleAICallLandlord(get, set);
            }
          }, 1000);
        }
      }
      
      return { gameState: newState };
    });
  },
  
  selectCard: (card: Card) => {
    set((state) => {
      const selected = [...state.gameState.selectedCards];
      const index = selected.findIndex((c) => c.id === card.id);
      
      if (index !== -1) {
        selected.splice(index, 1);
      } else {
        selected.push(card);
      }
      
      return {
        gameState: {
          ...state.gameState,
          selectedCards: selected,
        },
      };
    });
  },
  
  playCards: () => {
    set((state) => {
      const newState = { ...state.gameState };
      const selectedCards = [...newState.selectedCards];
      
      const info = identifyCardType(selectedCards);
      if (!info) return state;
      
      const lastInfo = newState.lastPlayedCards.length > 0 
        ? identifyCardType(newState.lastPlayedCards)
        : null;
      
      if (lastInfo && newState.lastPlayer !== newState.currentPlayer) {
        if (!compareCards(info, lastInfo)) return state;
      }
      
      newState.players[newState.currentPlayer].hand = 
        newState.players[newState.currentPlayer].hand.filter(
          (c) => !selectedCards.some((sc) => sc.id === c.id)
        );
      
      newState.lastPlayedCards = selectedCards;
      newState.lastPlayer = newState.currentPlayer;
      newState.selectedCards = [];
      
      if (newState.players[newState.currentPlayer].hand.length === 0) {
        newState.winner = newState.currentPlayer;
        newState.phase = 'finished';
        
        const isLandlordWin = newState.players[newState.currentPlayer].isLandlord;
        if (newState.players[0].isLandlord) {
          newState.playerCoins = isLandlordWin 
            ? newState.playerCoins + newState.baseScore * 2 
            : newState.playerCoins - newState.baseScore * 2;
        } else {
          newState.playerCoins = isLandlordWin 
            ? newState.playerCoins - newState.baseScore 
            : newState.playerCoins + newState.baseScore;
        }
        
        return { gameState: newState };
      }
      
      newState.currentPlayer = (newState.currentPlayer + 1) % 3;
      
      setTimeout(() => {
        const { gameState: currentState } = get();
        if (currentState.players[currentState.currentPlayer].isAI) {
          handleAIPlay(get, set);
        }
      }, 1500);
      
      return { gameState: newState };
    });
  },
  
  pass: () => {
    set((state) => {
      const newState = { ...state.gameState };
      
      newState.currentPlayer = (newState.currentPlayer + 1) % 3;
      
      if (newState.currentPlayer === newState.lastPlayer) {
        newState.lastPlayedCards = [];
        newState.lastPlayer = null;
      }
      
      setTimeout(() => {
        const { gameState: currentState } = get();
        if (currentState.players[currentState.currentPlayer].isAI) {
          handleAIPlay(get, set);
        }
      }, 1000);
      
      return { gameState: newState };
    });
  },
}));

const handleAICallLandlord = (get: () => GameStore, set: any) => {
  const { gameState, callLandlord } = get();
  const currentPlayer = gameState.players[gameState.currentPlayer];
  
  const shouldCall = aiCallLandlord(currentPlayer.hand, gameState.baseScore);
  callLandlord(shouldCall);
};

const handleAIPlay = (get: () => GameStore, set: any) => {
  const { gameState, playCards, pass } = get();
  const currentPlayer = gameState.players[gameState.currentPlayer];
  
  const lastInfo = gameState.lastPlayedCards.length > 0 
    ? identifyCardType(gameState.lastPlayedCards)
    : null;
  
  const cardsToPlay = aiPlayCards(currentPlayer.hand, lastInfo);
  
  if (cardsToPlay.length > 0) {
    set((state: any) => ({
      gameState: {
        ...state.gameState,
        selectedCards: cardsToPlay,
      },
    }));
    
    setTimeout(() => {
      const { playCards } = get();
      playCards();
    }, 500);
  } else {
    pass();
  }
};
