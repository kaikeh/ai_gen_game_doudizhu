
import { Card, PlayedCardInfo } from '../types';
import { identifyCardType, compareCards, sortCards } from './gameLogic';

// === 叫地主策略 ===
export const aiCallLandlord = (hand: Card[], baseScore: number): boolean => {
  let score = 0;
  
  // 1. 大牌数量
  const bigCards = hand.filter((c) => c.value >= 13);
  score += bigCards.length * 5;
  
  // 2. 王炸
  const hasJokers = hand.some(c => c.rank === '大王') && hand.some(c => c.rank === '小王');
  if (hasJokers) score += 15;
  
  // 3. 炸弹数量
  const rankCounts = getRankCountMap(hand);
  const bombCount = Object.values(rankCounts).filter(c => c === 4).length;
  score += bombCount * 12;
  
  // 4. 三张数量
  const tripleCount = Object.values(rankCounts).filter(c => c === 3).length;
  score += tripleCount * 4;
  
  // 5. 对子数量
  const pairCount = Object.values(rankCounts).filter(c => c === 2).length;
  score += pairCount * 2;
  
  // 根据底分调整门槛
  let threshold = 20;
  if (baseScore === 2) threshold = 25;
  if (baseScore === 3) threshold = 30;
  
  return score >= threshold;
};

// === 出牌策略 ===
export const aiPlayCards = (
  hand: Card[],
  lastPlayedInfo: PlayedCardInfo | null
): Card[] => {
  if (!lastPlayedInfo) {
    return findOptimalFirstPlay(hand);
  }
  
  return findBestPlayableCards(hand, lastPlayedInfo);
};

// === 首次出牌策略 ===
const findOptimalFirstPlay = (hand: Card[]): Card[] => {
  const sorted = sortCards([...hand]).reverse();
  const rankCounts = getRankCountMap(sorted);
  
  // 1. 先找顺子
  const straight = findStraight(sorted);
  if (straight) return straight;
  
  // 2. 找连对
  const pairStraight = findPairStraight(sorted, rankCounts);
  if (pairStraight) return pairStraight;
  
  // 3. 找三带二或三带一
  const triplePlay = findTriplePlay(sorted, rankCounts);
  if (triplePlay) return triplePlay;
  
  // 4. 找对子（最小的对子）
  const pairs = Object.entries(rankCounts)
    .filter(([_, count]) => count >= 2)
    .map(([rank]) => {
      const cards = sorted.filter(c => c.rank === rank);
      return [cards[0], cards[1]];
    })
    .sort((a, b) => a[0].value - b[0].value);
  
  if (pairs.length > 0) return pairs[0];
  
  // 5. 最后出最小的单张
  return [sorted[0]];
};

// === 跟牌策略 ===
const findBestPlayableCards = (hand: Card[], lastInfo: PlayedCardInfo): Card[] => {
  const sorted = sortCards([...hand]);
  const combinations = generateAllCombinations(sorted);
  
  // 找出所有能压过的牌型
  const playable = combinations.filter((combo) => {
    const info = identifyCardType(combo);
    return info && compareCards(info, lastInfo);
  });
  
  if (playable.length === 0) return [];
  
  // 选择最小的能压过的牌型
  return playable.sort((a, b) => {
    const infoA = identifyCardType(a)!;
    const infoB = identifyCardType(b)!;
    return infoA.value - infoB.value;
  })[0];
};

// === 生成所有可能的牌型 ===
const generateAllCombinations = (cards: Card[]): Card[][] => {
  const result: Card[][] = [];
  const rankCounts = getRankCountMap(cards);
  
  // 1. 单张
  cards.forEach(c => result.push([c]));
  
  // 2. 对子
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) {
        result.push([cards[i], cards[j]]);
      }
    }
  }
  
  // 3. 三张
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (cards[i].rank === cards[j].rank && cards[j].rank === cards[k].rank) {
          result.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  
  // 4. 三带一
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (cards[i].rank === cards[j].rank && cards[j].rank === cards[k].rank) {
          for (let l = 0; l < cards.length; l++) {
            if (l !== i && l !== j && l !== k && cards[l].rank !== cards[i].rank) {
              result.push([cards[i], cards[j], cards[k], cards[l]]);
            }
          }
        }
      }
    }
  }
  
  // 5. 三带二
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (cards[i].rank === cards[j].rank && cards[j].rank === cards[k].rank) {
          // 找一个对子
          for (let m = 0; m < cards.length; m++) {
            for (let n = m + 1; n < cards.length; n++) {
              if (m !== i && m !== j && m !== k && 
                  n !== i && n !== j && n !== k &&
                  cards[m].rank === cards[n].rank &&
                  cards[m].rank !== cards[i].rank) {
                result.push([cards[i], cards[j], cards[k], cards[m], cards[n]]);
              }
            }
          }
        }
      }
    }
  }
  
  // 6. 炸弹
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
  
  // 7. 王炸
  const jokers = cards.filter((c) => c.rank === '小王' || c.rank === '大王');
  if (jokers.length === 2) result.push(jokers);
  
  // 8. 顺子
  const straight = findStraight(cards);
  if (straight) result.push(straight);
  
  // 9. 连对
  const pairStraight = findPairStraight(cards, rankCounts);
  if (pairStraight) result.push(pairStraight);
  
  return result;
};

// === 辅助函数 ===
const getRankCountMap = (cards: Card[]) => {
  const counts: Record<string, number> = {};
  cards.forEach(c => {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  });
  return counts;
};

const findStraight = (cards: Card[]): Card[] | null => {
  const sortedValues = [...new Set(cards.map(c => c.value).filter(v => v <= 14))].sort((a, b) => a - b);
  
  // 找最长的顺子（至少 5 张）
  for (let len = 12; len >= 5; len--) {
    for (let start = 0; start <= sortedValues.length - len; start++) {
      let valid = true;
      for (let i = 1; i < len; i++) {
        if (sortedValues[start + i] !== sortedValues[start] + i) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        const values = sortedValues.slice(start, start + len);
        const straightCards: Card[] = [];
        
        values.forEach(v => {
          const card = cards.find(c => c.value === v);
          if (card) straightCards.push(card);
        });
        
        if (straightCards.length === len) {
          return straightCards;
        }
      }
    }
  }
  
  return null;
};

const findPairStraight = (cards: Card[], rankCounts: Record<string, number>): Card[] | null => {
  const pairRanks = Object.entries(rankCounts)
    .filter(([_, c]) => c >= 2)
    .map(([rank]) => {
      const card = cards.find(c => c.rank === rank)!;
      return { rank, value: card.value };
    })
    .filter(r => r.value <= 14)
    .sort((a, b) => a.value - b.value);
  
  // 找连对（至少 3 对，即 6 张牌）
  for (let len = 6; len >= 6; len -= 2) {
    const pairCount = len / 2;
    for (let start = 0; start <= pairRanks.length - pairCount; start++) {
      let valid = true;
      for (let i = 1; i < pairCount; i++) {
        if (pairRanks[start + i].value !== pairRanks[start].value + i) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        const pairStraightCards: Card[] = [];
        
        for (let i = 0; i < pairCount; i++) {
          const rankCards = cards.filter(c => c.rank === pairRanks[start + i].rank);
          pairStraightCards.push(rankCards[0], rankCards[1]);
        }
        
        return pairStraightCards;
      }
    }
  }
  
  return null;
};

const findTriplePlay = (cards: Card[], rankCounts: Record<string, number>): Card[] | null => {
  const tripleRanks = Object.entries(rankCounts)
    .filter(([_, c]) => c === 3)
    .map(([rank]) => {
      const card = cards.find(c => c.rank === rank)!;
      return { rank, value: card.value };
    })
    .sort((a, b) => a.value - b.value);
  
  if (tripleRanks.length > 0) {
    // 先尝试三带二
    const tripleCards = cards.filter(c => c.rank === tripleRanks[0].rank);
    const pairRanks = Object.entries(rankCounts)
      .filter(([r, c]) => c >= 2 && r !== tripleRanks[0].rank);
    
    if (pairRanks.length > 0) {
      const pairCards = cards.filter(c => c.rank === pairRanks[0][0]);
      return [...tripleCards, pairCards[0], pairCards[1]];
    }
    
    // 再尝试三带一
    const singleCard = cards.find(c => c.rank !== tripleRanks[0].rank);
    if (singleCard) {
      return [...tripleCards, singleCard];
    }
    
    // 最后只出三张
    return tripleCards;
  }
  
  return null;
};
