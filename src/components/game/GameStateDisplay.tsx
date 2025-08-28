'use client';

import React from 'react';
import { useGameStore } from '@/stores/gameStore';

export const GameStateDisplay: React.FC = () => {
  const countDisplay = useGameStore((state) => state.getCountDisplay());
  const scoreDisplay = useGameStore((state) => state.getScoreDisplay());
  const inningDisplay = useGameStore((state) => state.getInningDisplay());
  const currentBatter = useGameStore((state) => state.currentBatter);
  const runners = useGameStore((state) => 
    currentBatter === 'home' ? state.homeTeam.runners : state.awayTeam.runners
  );
  
  return (
    <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg">
      <div className="text-lg font-bold mb-2">{scoreDisplay}</div>
      <div className="text-sm mb-1">{inningDisplay}</div>
      <div className="text-xl font-mono mb-2">{countDisplay}</div>
      
      {/* ランナー状況表示 */}
      <div className="text-sm">
        <div className="mb-1">ランナー:</div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className={`text-center p-1 rounded ${runners.first ? 'bg-green-600' : 'bg-gray-600'}`}>
            1塁
          </div>
          <div className={`text-center p-1 rounded ${runners.second ? 'bg-green-600' : 'bg-gray-600'}`}>
            2塁
          </div>
          <div className={`text-center p-1 rounded ${runners.third ? 'bg-green-600' : 'bg-gray-600'}`}>
            3塁
          </div>
        </div>
      </div>
    </div>
  );
};