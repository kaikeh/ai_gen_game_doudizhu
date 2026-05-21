
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
    const state = get().gameState;
    let newState = { ...state };
    
    if (call) {
      newState.landlord = newState.currentPlayer;
      
      if (newState.baseScore < 3) {
        newState.baseScore++;
        newState.currentPlayer = (newState.currentPlayer + 1) % 3;
        
        set({ gameState: newState });
        
        setTimeout(() => {
          const { gameState: currentState } = get();
          if (currentState.players[currentState.currentPlayer].isAI) {
            handleAICallLandlord(get, set);
          }
        }, 1000);
      } else {
        // 达到最高底分，直接开始游戏
        startGamePhase(newState, set, get);
      }
    } else {
      if (newState.landlord !== null) {
        // 已经有人叫地主了，现在开始游戏
        startGamePhase(newState, set, get);
      } else {
        newState.currentPlayer = (newState.currentPlayer + 1) % 3;
        
        if (newState.currentPlayer === 0) {
          set({ gameState: newState });
          setTimeout(() => {
            const { startGame } = get();
            startGame();
          }, 500);
          return;
        }
        
        set({ gameState: newState });
        
        setTimeout(() => {
          const { gameState: currentState } = get();
          if (currentState.players[currentState.currentPlayer].isAI) {
            handleAICallLandlord(get, set);
          }
        }, 1000);
      }
    }
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

function startGamePhase(newState: GameState, set: any, get: any) {
  if (newState.landlord !== null) {
    // 给地主发底牌
    newState.players = newState.players.map((p, i) => 
      i === newState.landlord ? { ...p, hand: [...p.hand, ...newState.landlordCards], isLandlord: true } : p
    );
    newState.currentPlayer = newState.landlord;
    newState.phase = 'playing';
    
    set({ gameState: newState });
    
    // 如果地主是AI，让它出牌
    setTimeout(() => {
      const { gameState: currentState } = get();
      if (currentState.players[currentState.currentPlayer].isAI) {
        handleAIPlay(get, set);
      }
    }, 1500);
  }
}

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
