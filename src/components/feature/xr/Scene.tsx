'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { Vector3, Euler } from 'three';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
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
          
          {/* スタジアムのみ表示 */}
          <ErrorBoundary fallback={null}>
            <Suspense fallback={
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="gray" />
              </mesh>
            }>
              <BaseballStadium 
                debugMode={debugMode}
                position={stadiumPosition}
                rotation={stadiumRotation}
                scale={stadiumScale}
                modelPath="/models/BaseballStadium.glb"
                onLoad={() => console.log('Stadium loaded successfully')}
                onError={(error) => console.error('Stadium load error:', error)}
              />
            </Suspense>
          </ErrorBoundary>
        </XR>
      </Canvas>
    </>
  );
};
