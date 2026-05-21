
import { Card, PlayedCardInfo } from '../types';
import { identifyCardType, compareCards, sortCards } from './gameLogic';

export const aiCallLandlord = (hand: Card[], baseScore: number): boolean => {
  const bigCards = hand.filter((c) => c.value >= 13);
  return bigCards.length >= 4;
};

export const aiPlayCards = (
  hand: Card[],
  lastPlayedInfo: PlayedCardInfo | null
): Card[] => {
  if (!lastPlayedInfo) {
    return findSmallestCombination(hand);
  }
  
  return findPlayableCards(hand, lastPlayedInfo);
};

const findSmallestCombination = (hand: Card[]): Card[] => {
  const sorted = sortCards([...hand]).reverse();
  
  if (sorted.length > 0) {
    return [sorted[0]];
  }
  
  return [];
};

const findPlayableCards = (hand: Card[], lastInfo: PlayedCardInfo): Card[] => {
  const sorted = sortCards([...hand]);
  const combinations = generateCombinations(sorted);
  
  for (const combo of combinations) {
    const info = identifyCardType(combo);
    if (info && compareCards(info, lastInfo)) {
      return combo;
    }
  }
  
  return [];
};

const generateCombinations = (cards: Card[]): Card[][] => {
  const result: Card[][] = [];
  
  cards.forEach((c) => result.push([c]));
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        result.push([cards[i], cards[j]]);
      }
    }
  }
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (cards[i].rank === cards[j].rank && cards[j].rank === cards[k].rank) {
          result.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        for (let l = k + 1; l < cards.length; l++) {
          if (
            cards[i].rank === cards[j].rank &&
            cards[j].rank === cards[k].rank &&
            cards[k].rank === cards[l].rank
          ) {
            result.push([cards[i], cards[j], cards[k], cards[l]]);
          }
        }
      }
    }
  }
  
  const jokers = cards.filter((c) => c.rank === '小王' || c.rank === '大王');
  if (jokers.length === 2) {
    result.push(jokers);
  }
  
  return result;
};
