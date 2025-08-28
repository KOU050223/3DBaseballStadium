'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { BatController, BatControllerRef } from '@/components/common/3DComponent/BatController';
import { BattingMachine } from '@/components/common/3DComponent/BattingMachine';
import { Physics } from '@react-three/rapier';
import { MODEL_CONFIG } from '@/constants/ModelPosition';
import { Scoreboard } from '@/components/game/Scoreboard';
import { GameControls } from '@/components/game/GameControls';
import { RapierStadiumFieldVisualizer } from '@/components/field/RapierFieldZone';

interface SceneProps {
  debugMode?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [stadiumScale] = useState<number>(MODEL_CONFIG.STADIUM.scale);
  const [stadiumPosition] = useState<Vector3>(MODEL_CONFIG.STADIUM.position);
  const [stadiumRotation] = useState<Euler>(MODEL_CONFIG.STADIUM.rotation);

  const [batScale, setBatScale] = useState<number>(MODEL_CONFIG.BAT.scale);
  const [batPosition, setBatPosition] = useState<Vector3>(MODEL_CONFIG.BAT.position);
  const [ballSpeed, setBallSpeed] = useState<number>(60);
  const [gravityScale, setGravityScale] = useState<number>(1.5);
  const [showFieldZones, setShowFieldZones] = useState<boolean>(true);

  const batRef = useRef<BatControllerRef>(null);

  // キーボード操作でバットの位置を調整
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        setBatPosition(currentPosition => {
          const step = -0.05;
          let newX = currentPosition.x;

          if (event.key === 'ArrowLeft') {
            newX -= step;
          } else {
            newX += step;
          }
          
          // X座標を 0.7 から 2.5 の範囲に制限
          const clampedX = Math.max(0.7, Math.min(2.5, newX));
          
          return new Vector3(clampedX, currentPosition.y, currentPosition.z);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Define start and end rotations for the bat swing
  const startRotation = new Euler(-13 * Math.PI / 180, 0, 13 * Math.PI / 180);
  const endRotation = new Euler(-150 * Math.PI / 180, 0, 80 * Math.PI / 180);

  return (
    <div className="w-full h-full relative">
      {/* 電光掲示板風スコアボード */}
      <Scoreboard />
      
      {/* ゲーム制御UI */}
      <GameControls />
      
      <Canvas
        camera={{ position: [0, 1.5, -4]}}
      >
        <OrbitControls target={[0, 1.5, 0]} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Physics debug={debugMode}>
              <BaseballStadium 
                debugMode={debugMode}
                position={stadiumPosition}
                rotation={stadiumRotation}
                scale={stadiumScale}
                modelPath="/models/BaseballStadium.glb"
                onLoad={() => console.log('Stadium loaded')}
              />
              <BatController
                ref={batRef}
                position={batPosition}
                scale={batScale}
                startRotation={startRotation}
                endRotation={endRotation}
                modelPath="/models/BaseballBat.glb"
                onLoad={() => console.log('Bat loaded')}
              />
              
              {/* バッティングマシーンとボール */}
              <BattingMachine
                position={new Vector3(0, 2, 23)}
                rotation={new Euler(0, Math.PI, 0)}
                launchInterval={2.0}
                ballSpeed={ballSpeed}
                launchAngle={-2}
                autoStart={true}
                debugMode={debugMode}
                gravityScale={gravityScale}
              />

              {/* フィールドゾーン表示 */}
              {showFieldZones && (
                <RapierStadiumFieldVisualizer 
                  visible={true} 
                  animated={true}
                  showDebugInfo={debugMode}
                />
              )}
            </Physics>
          </Suspense>
        </ErrorBoundary>
      </Canvas>

      {debugMode && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-3 rounded text-xs w-64 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">統合シーンデバッグ</span>
          </div>
          
          <div className="mb-4">
            <div className="text-red-300 mb-2 font-semibold">当たり判定</div>
            <div className="text-xs text-gray-300">
              <div>スイング中: {batRef.current?.isSwinging() ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-yellow-300 mb-2 font-semibold">操作</div>
            <div className="text-xs text-gray-300">
              <div>スペースキー: バットスイング</div>
              <div>左右矢印キー: バット左右移動</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-blue-300 mb-2 font-semibold">バット</div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Scale</div>
              <input
                type="range" min="0.1" max="3" step="0.1" value={batScale}
                onChange={(e) => setBatScale(+e.target.value)}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{batScale.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Position X (左右)</div>
              <input
                type="range" min="-5" max="5" step="0.1" value={batPosition.x}
                onChange={(e) => setBatPosition(new Vector3(+e.target.value, batPosition.y, batPosition.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{batPosition.x.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Position Y (上下)</div>
              <input
                type="range" min="-5" max="10" step="0.1" value={batPosition.y}
                onChange={(e) => setBatPosition(new Vector3(batPosition.x, +e.target.value, batPosition.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{batPosition.y.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Position Z (前後)</div>
              <input
                type="range" min="-5" max="5" step="0.1" value={batPosition.z}
                onChange={(e) => setBatPosition(new Vector3(batPosition.x, batPosition.y, +e.target.value))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{batPosition.z.toFixed(1)}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-green-300 mb-2 font-semibold">ボール</div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Speed</div>
              <input
                type="range" min="10" max="150" step="1" value={ballSpeed}
                onChange={(e) => setBallSpeed(+e.target.value)}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{ballSpeed}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Gravity</div>
              <input
                type="range" min="0" max="5" step="0.1" value={gravityScale}
                onChange={(e) => setGravityScale(+e.target.value)}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{gravityScale.toFixed(1)}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-purple-300 mb-2 font-semibold">フィールドゾーン</div>
            <div className="mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showFieldZones}
                  onChange={(e) => setShowFieldZones(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300 text-xs">ゾーン表示</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};