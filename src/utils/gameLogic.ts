
import { Card, CardType, PlayedCardInfo } from '../types';

export const createDeck = (): Card[] => {
  const suits = ['♠', '♥', '♣', '♦'];
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  
  const deck: Card[] = [];
  
  suits.forEach((suit) => {
    ranks.forEach((rank, index) => {
      deck.push({
        suit,
        rank,
        value: index + 3,
        id: `${suit}-${rank}`,
      });
    });
  });
  
  deck.push({ suit: '♠', rank: '小王', value: 16, id: '小王' });
  deck.push({ suit: '♠', rank: '大王', value: 17, id: '大王' });
  
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealCards = (deck: Card[]) => {
  const shuffled = shuffleDeck(deck);
  const player1 = shuffled.slice(0, 17);
  const player2 = shuffled.slice(17, 34);
  const player3 = shuffled.slice(34, 51);
  const landlordCards = shuffled.slice(51, 54);
  
  return {
    hands: [sortCards(player1), sortCards(player2), sortCards(player3)],
    landlordCards: sortCards(landlordCards),
  };
};

export const sortCards = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => b.value - a.value);
};

export const identifyCardType = (cards: Card[]): PlayedCardInfo | null => {
  if (cards.length === 0) return null;
  
  const sorted = sortCards(cards);
  const len = sorted.length;
  
  if (len === 2 && sorted[0].rank === '大王' && sorted[1].rank === '小王') {
    return { type: 'rocket', cards: sorted, value: 100 };
  }
  
  if (len === 4 && sorted.every((c) => c.rank === sorted[0].rank)) {
    return { type: 'bomb', cards: sorted, value: sorted[0].value * 10 };
  }
  
  if (len === 1) {
    return { type: 'single', cards: sorted, value: sorted[0].value };
  }
  
  if (len === 2 && sorted[0].rank === sorted[1].rank) {
    return { type: 'pair', cards: sorted, value: sorted[0].value };
  }
  
  if (len === 3 && sorted.every((c) => c.rank === sorted[0].rank)) {
    return { type: 'triple', cards: sorted, value: sorted[0].value };
  }
  
  if (len === 4) {
    const rankCounts = getRankCounts(sorted);
    const tripleRank = Object.keys(rankCounts).find((r) => rankCounts[r] === 3);
    if (tripleRank) {
      return { type: 'tripleWithOne', cards: sorted, value: getCardValue(tripleRank as any) };
    }
  }
  
  if (len === 5) {
    const rankCounts = getRankCounts(sorted);
    const ranks = Object.keys(rankCounts);
    if (ranks.length === 2) {
      const [r1, r2] = ranks;
      if ((rankCounts[r1] === 3 && rankCounts[r2] === 2) || 
          (rankCounts[r2] === 3 && rankCounts[r1] === 2)) {
        const tripleRank = rankCounts[r1] === 3 ? r1 : r2;
        return { type: 'tripleWithTwo', cards: sorted, value: getCardValue(tripleRank as any) };
      }
    }
  }
  
  if (len >= 5 && len <= 12) {
    const values = sorted.map((c) => c.value).sort((a, b) => a - b);
    if (values.every((v) => v <= 14) && isStraight(values)) {
      return { type: 'straight', cards: sorted, value: values[0] };
    }
  }
  
  if (len >= 6 && len % 2 === 0) {
    const rankCounts = getRankCounts(sorted);
    const ranks = Object.keys(rankCounts).sort((a, b) => getCardValue(a as any) - getCardValue(b as any));
    if (ranks.length === len / 2 && ranks.every((r) => rankCounts[r] === 2)) {
      const values = ranks.map((r) => getCardValue(r as any));
      if (values.every((v) => v <= 14) && isStraight(values)) {
        return { type: 'pairStraight', cards: sorted, value: values[0] };
      }
    }
  }
  
  if (len === 6 || len === 8) {
    const rankCounts = getRankCounts(sorted);
    const fourRank = Object.keys(rankCounts).find((r) => rankCounts[r] === 4);
    if (fourRank) {
      return { type: 'fourWithTwo', cards: sorted, value: getCardValue(fourRank as any) };
    }
  }
  
  return null;
};

const getCardValue = (rank: Card['rank']): number => {
  const values = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17,
  };
  return values[rank];
};

const getRankCounts = (cards: Card[]) => {
  const counts: Record<string, number> = {};
  cards.forEach((c) => {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  });
  return counts;
};

const isStraight = (values: number[]): boolean => {
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      return false;
    }
  }
  return true;
};

export const compareCards = (newCards: PlayedCardInfo, lastCards: PlayedCardInfo | null): boolean => {
  if (!lastCards) return true;
  
  if (newCards.type === 'rocket') return true;
  if (lastCards.type === 'rocket') return false;
  
  if (newCards.type === 'bomb' && lastCards.type !== 'bomb') return true;
  if (lastCards.type === 'bomb' && newCards.type !== 'bomb') return false;
  
  if (newCards.type === lastCards.type && newCards.cards.length === lastCards.cards.length) {
    return newCards.value > lastCards.value;
  }
  
  return false;
};
