
import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  selected = false,
  onClick,
  faceDown = false,
}) => {
  const isRed = card.suit === '♥' || card.suit === '♦';

  const hoverClass = selected ? 'hover:-translate-y-4' : 'hover:-translate-y-2';
  
  return (
    <div
      onClick={onClick}
      className={`
        relative w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg shadow-lg
        transition-all duration-200 cursor-pointer select-none
        ${selected ? '-translate-y-4' : ''}
        ${faceDown ? 'bg-gradient-to-br from-green-700 to-green-900' : 'bg-white'}
        ${!faceDown ? 'border-2 border-gray-200' : ''}
        ${hoverClass}
        hover:shadow-xl
      `}
    >
      {faceDown ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-2xl font-bold opacity-70">🎴</div>
        </div>
      ) : (
        <>
          <div className={`absolute top-1 left-1 text-sm font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div>{card.rank}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
          
          <div className={`absolute bottom-1 right-1 text-sm font-bold rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            <div>{card.rank}</div>
            <div className="text-xs">{card.suit}</div>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center text-3xl ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
            {card.suit}
          </div>
        </>
      )}
    </div>
  );
};
