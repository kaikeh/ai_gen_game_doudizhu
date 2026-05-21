import React from 'react';
import { Trophy, Coins } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../components/Card';
import { identifyCardType, compareCards } from '../utils/gameLogic';

// 牌型名称映射
const cardTypeNames: Record<string, string> = {
  single: '单张',
  pair: '对子',
  triple: '三张',
  tripleWithOne: '三带一',
  tripleWithTwo: '三带二',
  straight: '顺子',
  pairStraight: '连对',
  plane: '飞机',
  planeWithWings: '飞机带翅膀',
  fourWithTwo: '四带二',
  bomb: '炸弹',
  rocket: '王炸',
};

export default function Home() {
  const { gameState, startGame, callLandlord, selectCard, playCards, pass } = useGameStore();
  
  function canPlay() {
    if (gameState.phase !== 'playing') return false;
    if (gameState.currentPlayer !== 0) return false;
    const selectedCards = gameState.selectedCards;
    if (selectedCards.length === 0) return false;
    const info = identifyCardType(selectedCards);
    if (!info) return false;
    const lastInfo = gameState.lastPlayedCards.length > 0 ? identifyCardType(gameState.lastPlayedCards) : null;
    
    // 如果还没有出过牌，或者上一个出牌的是自己（新的一轮），直接可以出
    if (lastInfo === null || gameState.lastPlayer === 0) {
      return true;
    }
    
    // 否则需要能压过上家
    return compareCards(info, lastInfo);
  }
  
  function canPass() {
    if (gameState.phase !== 'playing') return false;
    if (gameState.currentPlayer !== 0) return false;
    if (gameState.lastPlayedCards.length === 0) return false;
    return gameState.lastPlayer !== 0;
  }
  
  function isGameOver() {
    return gameState.playerCoins <= 0;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-900 to-black flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-black/30 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
          <Coins size={24} />
          <span>金币: {gameState.playerCoins}</span>
        </div>
        <div className="text-yellow-400 font-bold text-xl">
          底分: {gameState.baseScore}
        </div>
      </div>
      
      {/* 牌桌区域 - 倒三角形布局 */}
      <div className="flex-1 flex flex-col p-4 relative">
        {/* 地主底牌区域 */}
        {gameState.phase === 'playing' && (
          <div className="flex justify-center mb-4">
            <div className="flex gap-1">
              {gameState.landlordCards.map((card, index) => (
                <Card key={index} card={card} faceDown={false} />
              ))}
            </div>
          </div>
        )}
        {gameState.phase === 'calling' && gameState.landlordCards.length > 0 && (
          <div className="flex justify-center mb-4">
            <div className="flex gap-1">
              {gameState.landlordCards.map((_, index) => (
                <div key={index} className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-gradient-to-br from-green-700 to-green-900 shadow-md flex items-center justify-center">
                  <div className="text-white text-2xl font-bold opacity-70">🎴</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 顶部：两个电脑玩家 */}
        <div className="flex justify-between items-start">
          {/* 电脑1 - 左上角 */}
          <div className="flex flex-col items-center gap-2">
            <div className={gameState.players[1].isLandlord ? 'text-white font-bold px-4 py-2 rounded-lg bg-yellow-600' : 'text-white font-bold px-4 py-2 rounded-lg bg-black/40'}>
              {gameState.players[1].name}
              {gameState.players[1].isLandlord ? ' (地主)' : ''}
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-black/50 text-yellow-400 px-3 py-1 rounded-full font-bold">
                {gameState.players[1].hand.length}张
              </div>
              <div className="flex gap-1">
                {gameState.players[1].hand.slice(0, 10).map((_, index) => (
                  <div key={index} className="w-6 h-10 sm:w-8 sm:h-14 bg-gradient-to-br from-green-700 to-green-900 rounded shadow-md" />
                ))}
              </div>
            </div>
          </div>
          
          {/* 右上角：电脑2 */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {gameState.players[2].hand.slice(0, 10).map((_, index) => (
                  <div key={index} className="w-6 h-10 sm:w-8 sm:h-14 bg-gradient-to-br from-green-700 to-green-900 rounded shadow-md" />
                ))}
              </div>
              <div className="bg-black/50 text-yellow-400 px-3 py-1 rounded-full font-bold">
                {gameState.players[2].hand.length}张
              </div>
            </div>
            <div className={gameState.players[2].isLandlord ? 'text-white font-bold px-4 py-2 rounded-lg bg-yellow-600' : 'text-white font-bold px-4 py-2 rounded-lg bg-black/40'}>
              {gameState.players[2].name}
              {gameState.players[2].isLandlord ? ' (地主)' : ''}
            </div>
          </div>
        </div>
        
        {/* 中间区域：出牌信息和状态 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* 当前回合提示 */}
            {gameState.phase === 'playing' && (
              <div className="text-yellow-400 font-bold text-lg mb-4">
                {gameState.players[gameState.currentPlayer].name} 的回合
              </div>
            )}
            
            {/* 最后出的牌 */}
            {gameState.lastPlayedCards.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {gameState.lastPlayedCards.map((card, index) => (
                    <Card key={index} card={card} />
                  ))}
                </div>
                {gameState.lastPlayer !== null && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-blue-600/80 text-white px-4 py-1 rounded-lg font-bold text-lg">
                      {(() => {
                        const info = identifyCardType(gameState.lastPlayedCards);
                        return info ? cardTypeNames[info.type] || info.type : '';
                      })()}
                    </div>
                    <div className="text-white/70 text-sm">
                      {gameState.players[gameState.lastPlayer].name} 出牌
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 开始游戏按钮 */}
            {gameState.phase === 'waiting' && !isGameOver() && (
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-xl rounded-lg shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition-all hover:scale-105"
              >
                开始游戏
              </button>
            )}
            
            {/* 游戏结束 */}
            {gameState.phase === 'finished' && !isGameOver() && (
              <div className="text-center">
                <div className={gameState.winner === 0 ? 'text-3xl font-bold mb-4 text-green-400' : 'text-3xl font-bold mb-4 text-red-400'}>
                  {gameState.winner === 0 ? '恭喜你赢了！' : '你输了！'}
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-xl rounded-lg shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition-all hover:scale-105"
                >
                  再来一局
                </button>
              </div>
            )}
            
            {/* 金币输光 */}
            {isGameOver() && (
              <div className="text-center">
                <Trophy size={64} className="mx-auto text-yellow-400 mb-4" />
                <div className="text-3xl font-bold text-red-400 mb-4">
                  金币输光了！游戏结束！
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-xl rounded-lg shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition-all hover:scale-105"
                >
                  重新开始
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 底部：玩家手牌和控制按钮 */}
      <div className="bg-black/30 backdrop-blur-sm p-4">
        {/* 玩家手牌 */}
        <div className="flex justify-center flex-wrap gap-1 mb-4">
          {gameState.players[0].hand.map((card) => (
            <Card
              key={card.id}
              card={card}
              selected={gameState.selectedCards.some(c => c.id === card.id)}
              onClick={() => {
                if (gameState.phase === 'playing' && gameState.currentPlayer === 0) {
                  selectCard(card);
                }
              }}
            />
          ))}
        </div>
        
        {/* 控制面板 */}
        <div className="flex items-center justify-between">
          {/* 玩家信息 */}
          <div className={gameState.players[0].isLandlord ? 'text-white font-bold px-4 py-2 rounded-lg bg-yellow-600' : 'text-white font-bold px-4 py-2 rounded-lg bg-black/40'}>
            {gameState.players[0].name}
            {gameState.players[0].isLandlord ? ' (地主)' : ''}
            <span className="ml-2 text-yellow-300">({gameState.players[0].hand.length}张牌)</span>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3">
            {/* 叫地主阶段 */}
            {gameState.phase === 'calling' && gameState.currentPlayer === 0 && (
              <>
                <button
                  onClick={() => callLandlord(false)}
                  className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
                >
                  不叫
                </button>
                <button
                  onClick={() => callLandlord(true)}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all"
                >
                  {gameState.baseScore === 1 ? '叫地主' : '抢地主'}
                </button>
              </>
            )}
            
            {/* 出牌阶段 */}
            {gameState.phase === 'playing' && gameState.currentPlayer === 0 && (
              <>
                {canPass() && (
                  <button
                    onClick={pass}
                    className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
                  >
                    不出
                  </button>
                )}
                <button
                  onClick={playCards}
                  disabled={!canPlay()}
                  className={canPlay() ? 'px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all' : 'px-6 py-3 bg-gray-500 text-gray-300 cursor-not-allowed font-bold rounded-lg transition-all'}
                >
                  出牌
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
