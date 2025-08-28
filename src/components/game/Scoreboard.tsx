'use client';

import React from 'react';
import { useGameStore } from '@/stores/gameStore';

export const Scoreboard: React.FC = () => {
  const homeTeam = useGameStore((state) => state.homeTeam);
  const awayTeam = useGameStore((state) => state.awayTeam);
  const inning = useGameStore((state) => state.inning);
  const count = useGameStore((state) => state.count);
  const currentBatter = useGameStore((state) => state.currentBatter);
  const isGameActive = useGameStore((state) => state.isGameActive);

  // 現在のバッティングチームのランナー状況
  const runners = currentBatter === 'home' ? homeTeam.runners : awayTeam.runners;

  return (
    <div className="fixed top-4 left-4 z-50">
      {/* メインスコアボード */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-yellow-400 rounded-lg p-6 text-white shadow-2xl">
        {/* ヘッダー - ゲーム状況 */}
        <div className="text-center mb-4">
          <div className="text-yellow-400 text-xl font-bold tracking-wider">
            BASEBALL STADIUM
          </div>
          <div className={`text-sm font-mono ${isGameActive ? 'text-green-400' : 'text-red-400'}`}>
            {isGameActive ? 'GAME IN PROGRESS' : 'GAME STOPPED'}
          </div>
        </div>

        {/* スコア表示 */}
        <div className="grid grid-cols-7 gap-1 mb-4 text-center text-sm font-mono">
          {/* ヘッダー */}
          <div className="col-span-1 text-yellow-400 font-bold">TEAM</div>
          <div className="text-yellow-400 font-bold">1</div>
          <div className="text-yellow-400 font-bold">2</div>
          <div className="text-yellow-400 font-bold">3</div>
          <div className="text-yellow-400 font-bold">R</div>
          <div className="text-yellow-400 font-bold">H</div>
          <div className="text-yellow-400 font-bold">E</div>

          {/* アウェイチーム */}
          <div className="bg-blue-800 px-2 py-1 rounded text-white font-bold">AWAY</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-blue-600 px-2 py-1 text-white font-bold text-lg">{awayTeam.score}</div>
          <div className="bg-gray-600 px-2 py-1 text-white">{awayTeam.hits}</div>
          <div className="bg-gray-600 px-2 py-1 text-white">{awayTeam.errors}</div>

          {/* ホームチーム */}
          <div className="bg-red-800 px-2 py-1 rounded text-white font-bold">HOME</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-gray-700 px-2 py-1">-</div>
          <div className="bg-red-600 px-2 py-1 text-white font-bold text-lg">{homeTeam.score}</div>
          <div className="bg-gray-600 px-2 py-1 text-white">{homeTeam.hits}</div>
          <div className="bg-gray-600 px-2 py-1 text-white">{homeTeam.errors}</div>
        </div>

        {/* イニングとカウント情報 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* イニング表示 */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 text-xs font-bold mb-1">INNING</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{inning.current}</div>
              <div className={`text-sm font-mono ${inning.isTop ? 'text-blue-400' : 'text-red-400'}`}>
                {inning.isTop ? '▲ TOP' : '▼ BOTTOM'}
              </div>
            </div>
          </div>

          {/* カウント表示 */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 text-xs font-bold mb-1">COUNT</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-400">BALL</div>
                <div className="text-lg font-bold text-green-400">{count.balls}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">STRIKE</div>
                <div className="text-lg font-bold text-red-400">{count.strikes}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">OUT</div>
                <div className="text-lg font-bold text-yellow-400">{count.outs}</div>
              </div>
            </div>
          </div>
        </div>

        {/* バッター情報 */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-400 mb-1">AT BAT</div>
          <div className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${
            currentBatter === 'home' 
              ? 'bg-red-600 text-white' 
              : 'bg-blue-600 text-white'
          }`}>
            {currentBatter === 'home' ? 'HOME' : 'AWAY'}
          </div>
        </div>

        {/* ランナー状況（ダイヤモンド形式） */}
        <div className="bg-green-800 rounded-lg p-4">
          <div className="text-yellow-400 text-xs font-bold text-center mb-2">BASE RUNNERS</div>
          <div className="relative w-32 h-32 mx-auto">
            {/* ダイヤモンド形状 */}
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
            >
              {/* ベースライン */}
              <path
                d="M 50 10 L 90 50 L 50 90 L 10 50 Z"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* ホームプレート */}
              <circle cx="50" cy="90" r="6" fill="white" />
              
              {/* 1塁 */}
              <rect
                x="84" y="44" width="12" height="12"
                fill={runners.first ? "#22c55e" : "#6b7280"}
                stroke="white"
                strokeWidth="1"
              />
              <text x="90" y="40" textAnchor="middle" fontSize="8" fill="white">1st</text>
              
              {/* 2塁 */}
              <rect
                x="44" y="4" width="12" height="12"
                fill={runners.second ? "#22c55e" : "#6b7280"}
                stroke="white"
                strokeWidth="1"
              />
              <text x="50" y="2" textAnchor="middle" fontSize="8" fill="white">2nd</text>
              
              {/* 3塁 */}
              <rect
                x="4" y="44" width="12" height="12"
                fill={runners.third ? "#22c55e" : "#6b7280"}
                stroke="white"
                strokeWidth="1"
              />
              <text x="10" y="40" textAnchor="middle" fontSize="8" fill="white">3rd</text>
            </svg>
          </div>
          
          {/* ランナー状況の説明 */}
          <div className="text-center mt-2">
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span>Runner</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded mr-1"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};