'use client';

import React from 'react';
import { useGameActions, useGameStore } from '@/stores/gameStore';

export const GameControls: React.FC = () => {
  const isGameActive = useGameStore((state) => state.isGameActive);
  const { startGame, resetGame, processPlayResult } = useGameActions();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border-2 border-yellow-400 rounded-lg p-4 text-white">
      <div className="text-yellow-400 text-sm font-bold mb-3">GAME CONTROL</div>
      
      {/* ゲーム制御 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => startGame()}
          disabled={isGameActive}
          className={`px-3 py-2 rounded text-sm font-bold ${
            isGameActive 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          START
        </button>
        <button
          onClick={() => resetGame()}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold"
        >
          RESET
        </button>
      </div>

      {/* プレイ結果ボタン */}
      <div className="text-yellow-400 text-xs font-bold mb-2">PLAY RESULTS</div>
      <div className="grid grid-cols-3 gap-1 mb-2">
        <button
          onClick={() => processPlayResult('strike')}
          className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs"
        >
          Strike
        </button>
        <button
          onClick={() => processPlayResult('ball')}
          className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs"
        >
          Ball
        </button>
        <button
          onClick={() => processPlayResult('foul')}
          className="px-2 py-1 bg-orange-700 hover:bg-orange-800 text-white rounded text-xs"
        >
          Foul
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-1 mb-2">
        <button
          onClick={() => processPlayResult('single')}
          className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs"
        >
          Single
        </button>
        <button
          onClick={() => processPlayResult('double')}
          className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs"
        >
          Double
        </button>
        <button
          onClick={() => processPlayResult('triple')}
          className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs"
        >
          Triple
        </button>
        <button
          onClick={() => processPlayResult('homerun')}
          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
        >
          HR
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => processPlayResult('out')}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs"
        >
          Out
        </button>
        <button
          onClick={() => processPlayResult('walk')}
          className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs"
        >
          Walk
        </button>
        <button
          onClick={() => processPlayResult('strikeout')}
          className="px-2 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-xs"
        >
          K
        </button>
      </div>
    </div>
  );
};