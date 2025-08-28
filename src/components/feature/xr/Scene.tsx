'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { BatController, BatControllerRef } from '@/components/common/3DComponent/BatController';
import { BattingMachine } from '@/components/common/3DComponent/BattingMachine';
import { Physics } from '@react-three/rapier';
import { MODEL_CONFIG } from '@/constants/ModelPosition';

interface SceneProps {
  debugMode?: boolean;
}

// XRストアの作成
const store = createXRStore();

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [stadiumScale] = useState<number>(MODEL_CONFIG.STADIUM.scale);
  const [stadiumPosition] = useState<Vector3>(MODEL_CONFIG.STADIUM.position);
  const [stadiumRotation] = useState<Euler>(MODEL_CONFIG.STADIUM.rotation);

  const [batScale, setBatScale] = useState<number>(MODEL_CONFIG.BAT.scale);
  const [batPosition, setBatPosition] = useState<Vector3>(MODEL_CONFIG.BAT.position);
  const [ballSpeed, setBallSpeed] = useState<number>(60);
  const [gravityScale, setGravityScale] = useState<number>(1.5);

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
    <>
      {/* AR/VRエントリーボタン */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '16px'
      }}>
        <button 
          type="button" 
          onClick={() => store.enterVR()}
          className="vr-enter-button"
          style={{
            backgroundColor: '#1E40AF',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '180px',
            minHeight: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
            transition: 'all 0.2s ease',
            outline: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1E3A8A';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1E40AF';
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
          }}
        >
          🥽 VR体験を開始
        </button>

        <button 
          type="button" 
          onClick={() => store.enterAR()}
          className="ar-enter-button"
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '180px',
            minHeight: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            transition: 'all 0.2s ease',
            outline: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#047857';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
            e.currentTarget.style.transform = 'translateY(0px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
          }}
        >
          📱 AR体験を開始
        </button>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 999
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Meta Quest 3 Debug</div>
          <div>User Agent: {typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Quest') ? 'Meta Quest Browser' : 'Other Browser') : 'Loading...'}</div>
          <div>WebXR: {typeof navigator !== 'undefined' && 'xr' in navigator ? '✅' : '❌'}</div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
            推奨: Meta Quest Browser使用<br/>
            Settings → Advanced → Developer Mode → WebXR有効化
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <XR store={store}>
          {/* 非XR時のカメラコントロール */}
          <OrbitControls 
            target={[0, 1, 0]} 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          
          {/* 照明設定 - Meta Quest 3に最適化 */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* 環境マップ */}
          <Environment preset="sunset" background />
          
          {/* スタジアム、バット、バッティングマシーン */}
          <ErrorBoundary fallback={null}>
            <Suspense fallback={
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="gray" />
              </mesh>
            }>
              <Physics debug={debugMode}>
                <BaseballStadium 
                  debugMode={debugMode}
                  position={stadiumPosition}
                  rotation={stadiumRotation}
                  scale={stadiumScale}
                  modelPath="/models/BaseballStadium.glb"
                  onLoad={() => console.log('Stadium loaded successfully')}
                  onError={(error) => console.error('Stadium load error:', error)}
                />
                <BatController
                  ref={batRef}
                  position={batPosition}
                  scale={batScale}
                  startRotation={new Euler(-13 * Math.PI / 180, 0, 13 * Math.PI / 180)}
                  endRotation={new Euler(-150 * Math.PI / 180, 0, 80 * Math.PI / 180)}
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
              </Physics>
            </Suspense>
          </ErrorBoundary>
        </XR>
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
        </div>
      )}
    </>
  );
};
