'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { XR, createXRStore, useXR } from '@react-three/xr';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { VRBatController, VRBatControllerRef } from '@/components/common/3DComponent/VRBatController';
import { BattingMachine } from '@/components/common/3DComponent/BattingMachine';
import { Physics } from '@react-three/rapier';
import { MODEL_CONFIG } from '@/constants/ModelPosition';

interface SceneProps {
  debugMode?: boolean;
}

const store = createXRStore();

// VR状態表示コンポーネント
const VRStatusDisplay: React.FC = () => {
  const xrState = useXR();
  // sessionの存在でVR状態を判定
  const isPresenting = !!xrState.session;
  return <span>{isPresenting ? '🥽 VR Active' : '📱 Standard Mode'}</span>;
};

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [stadiumScale] = useState<number>(MODEL_CONFIG.STADIUM.scale);
  const [stadiumPosition] = useState<Vector3>(MODEL_CONFIG.STADIUM.position);
  const [stadiumRotation] = useState<Euler>(MODEL_CONFIG.STADIUM.rotation);

  const [batScale, setBatScale] = useState<number>(MODEL_CONFIG.BAT.scale);
  const [batPosition, setBatPosition] = useState<Vector3>(MODEL_CONFIG.BAT.position);
  const [ballSpeed, setBallSpeed] = useState<number>(60);
  const [gravityScale, setGravityScale] = useState<number>(1.5);

  const batRef = useRef<VRBatControllerRef>(null);

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
          onClick={() => {
            console.log('Entering VR...');
            store.enterVR().catch((error) => {
              console.error('Failed to enter VR:', error);
            });
          }}
          style={{
            backgroundColor: '#1E40AF',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '220px',
            minHeight: '60px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
        >
          🥽 VR野球体験を開始
        </button>

        <button 
          type="button" 
          onClick={() => {
            console.log('Entering AR...');
            store.enterAR().catch((error) => {
              console.error('Failed to enter AR:', error);
            });
          }}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            minWidth: '220px',
            minHeight: '60px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
        >
          📱 AR野球体験を開始
        </button>
      </div>

      {/* VR操作説明 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '24px',
        borderRadius: '15px',
        fontSize: '16px',
        maxWidth: '350px',
        zIndex: 999,
        border: '2px solid #4FC3F7'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#4FC3F7', fontSize: '18px' }}>
          🎯 Meta Quest 3 操作方法
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: '#FFD54F' }}>右手コントローラー（バット）:</strong><br/>
          • 🎮 トリガー（人差し指）: バットスイング<br/>
          • 🤏 グリップ（中指）: バットスイング<br/>
          • 📍 コントローラーを動かしてバット操作
        </div>
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ color: '#81C784' }}>キーボード操作（非VR）:</strong><br/>
          • スペースキー: バットスイング<br/>
          • 左右矢印キー: バット移動
        </div>
        <div style={{ fontSize: '14px', color: '#FFD54F', backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: '8px', borderRadius: '8px' }}>
          💡 VRに入ると右手コントローラーでバットを直接操作できます！
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 999
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Meta Quest 3 Debug</div>
          <div>WebXR: {typeof navigator !== 'undefined' && 'xr' in navigator ? '✅' : '❌'}</div>
          <div>VR Status: 📱 Standard Mode</div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
            最新@react-three/xr v6+ API使用<br/>
            コンソールでログを確認してください
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
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          console.log('Canvas created, WebXR supported:', !!gl.xr);
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
          
          {/* 照明設定 */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* 環境マップ */}
          <Environment preset="sunset" background />
          
          {/* 3Dコンテンツ */}
          <ErrorBoundary fallback={
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          }>
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
                
                {/* 最新API対応VRバットコントローラー */}
                <VRBatController
                  ref={batRef}
                  position={batPosition}
                  scale={batScale}
                  startRotation={startRotation}
                  endRotation={endRotation}
                  modelPath="/models/BaseballBat.glb"
                  onLoad={() => console.log('VR Bat loaded successfully')}
                  enableVR={true}
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
        <div className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded text-xs w-64 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">最新VRバットデバッグ</span>
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
              <div>VR: 右手コントローラーでバット操作</div>
              <div>非VR: スペースキー でバットスイング</div>
              <div>非VR: 左右矢印キー でバット左右移動</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-blue-300 mb-2 font-semibold">バット設定</div>
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
          </div>

          <div className="mb-4">
            <div className="text-green-300 mb-2 font-semibold">ボール設定</div>
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
