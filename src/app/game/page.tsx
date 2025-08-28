///
///将来的に消します
///
'use client';

import React, { useState } from 'react';
import { Scene } from '@/components/feature/simple/Scene';

const GamePage: React.FC = () => {
  const [debugMode, setDebugMode] = useState(false);

  return (
    <div className="w-screen h-screen relative">
      <Scene debugMode={debugMode} />
      
      {/* デバッグモード切り替えボタン */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-4 py-2 rounded text-white ${
            debugMode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {debugMode ? 'デバッグOFF' : 'デバッグON'}
        </button>
      </div>

      {/* 操作説明 */}
      <div className="fixed bottom-4 right-4 z-50 bg-black bg-opacity-70 text-white p-3 rounded text-sm">
        <div className="font-bold mb-1">操作方法</div>
        <div>• マウス: カメラ回転</div>
        <div>• ホイール: ズーム</div>
        <div>• スペースキー: バットスイング</div>
        <div>• デバッグモード: 当たり判定の境界ボックス表示</div>
      </div>
    </div>
  );
};

export default GamePage;
