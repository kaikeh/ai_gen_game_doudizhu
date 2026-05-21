
const fs = require('fs');
const path = require('path');

const content = `import React from 'react';
import { Trophy, Coins } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { Card } from '../components/Card';
import { identifyCardType, compareCards } from '../utils/gameLogic';

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
    if (lastInfo !== null) {
      if (gameState.lastPlayer !== 0) {
        return compareCards(info, lastInfo);
      }
    }
    return true;
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
      <div className="bg-black/30 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
          <Coins size={24} />
          <span>金币: {gameState.playerCoins}</span>
        </div>
        <div className="text-yellow-400 font-bold text-xl">
          底分: {gameState.baseScore}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex items-center justify-center gap-4">
          <div className={`text-white font-bold px-4 py-2 rounded-lg ${gameState.players[1].isLandlord ? 'bg-yellow-600' : 'bg-black/40'}`}>
            {gameState.players[1].name}
            {gameState.players[1].isLandlord ? ' (地主)' : ''}
          </div>
          <div className="flex items-center gap-2">
            {gameState.players[1].hand.map((_, index) => (
              <div key={index} className="w-6 h-10 sm:w-8 sm:h-14 bg-gradient-to-br from-green-700 to-green-900 rounded shadow-md -ml-3 first:ml-0" />
            ))}
            <div className="ml-4 bg-black/50 text-yellow-400 px-3 py-1 rounded-full font-bold">
              {gameState.players[1].hand.length}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          {gameState.phase === 'playing' && (
            <div className="flex gap-1">
              {gameState.landlordCards.map((card, index) => (
                <Card key={index} card={card} faceDown={gameState.landlord !== null} />
              ))}
            </div>
          )}

          {gameState.lastPlayedCards.length > 0 && (
            <div className="flex gap-1">
              {gameState.lastPlayedCards.map((card, index) => (
                <Card key={index} card={card} />
              ))}
            </div>
          )}

          {gameState.phase === 'playing' && (
            <div className="text-yellow-400 font-bold text-lg">
              {gameState.players[gameState.currentPlayer].name} 的回合
            </div>
          )}

          {gameState.phase === 'waiting' && !isGameOver() && (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-xl rounded-lg shadow-lg hover:from-yellow-600 hover:to-yellow-700 transition-all hover:scale-105"
            >
              开始游戏
            </button>
          )}

          {gameState.phase === 'finished' && !isGameOver() && (
            <div className="text-center">
              <div className={`text-3xl font-bold mb-4 ${gameState.winner === 0 ? 'text-green-400' : 'text-red-400'}`}>
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

        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            {gameState.players[2].hand.map((_, index) => (
              <div key={index} className="w-6 h-10 sm:w-8 sm:h-14 bg-gradient-to-br from-green-700 to-green-900 rounded shadow-md -ml-3 first:ml-0" />
            ))}
            <div className="ml-4 bg-black/50 text-yellow-400 px-3 py-1 rounded-full font-bold">
              {gameState.players[2].hand.length}
            </div>
          </div>
          <div className={`text-white font-bold px-4 py-2 rounded-lg ${gameState.players[2].isLandlord ? 'bg-yellow-600' : 'bg-black/40'}`}>
            {gameState.players[2].name}
            {gameState.players[2].isLandlord ? ' (地主)' : ''}
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm p-4">
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

        <div className="flex items-center justify-between">
          <div className={`text-white font-bold px-4 py-2 rounded-lg ${gameState.players[0].isLandlord ? 'bg-yellow-600' : 'bg-black/40'}`}>
            {gameState.players[0].name}
            {gameState.players[0].isLandlord ? ' (地主)' : ''}
            <span className="ml-2 text-yellow-300">({gameState.players[0].hand.length}张牌)</span>
          </div>

          <div className="flex gap-3">
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
                  className={`px-6 py-3 font-bold rounded-lg transition-all ${
                    canPlay()
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
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
`;

const filePath = path.join(__dirname, 'src', 'pages', 'Home.tsx');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Home.tsx created successfully');
