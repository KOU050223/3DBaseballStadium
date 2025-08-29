'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { XR, createXRStore, useXR } from '@react-three/xr';
import styles from './Scene.module.css';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { VRBatController, VRBatControllerRef } from '@/components/xr/VRBatController';
import { XRBattingMachine } from '@/components/xr/XRBattingMachine';
import { Physics } from '@react-three/rapier';
import { MODEL_CONFIG } from '@/constants/ModelPosition';

interface SceneProps {
  debugMode?: boolean;
}

const store = createXRStore();

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
      <div className={styles.vrButtonContainer}>
        <button 
          type="button" 
          className={styles.vrButton}
          onClick={() => {
            store.enterVR().catch((error) => {
              console.error('Failed to enter VR:', error);
            });
          }}
        >
          VR野球体験を開始
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 75 }}
        className={styles.canvas}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {

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
                
                <XRBattingMachine
                  position={new Vector3(0, 2, 23)}
                  rotation={new Euler(0, Math.PI, 0)}
                  launchInterval={2.0}
                  ballSpeed={ballSpeed}
                  launchAngle={-2}
                  autoStart={true}
                  debugMode={debugMode}
                  gravityScale={gravityScale}
                  getBatVelocity={() => batRef.current?.getBatVelocity() || new Vector3(0, 0, 0)}
                />
              </Physics>
            </Suspense>
          </ErrorBoundary>
        </XR>
      </Canvas>

    </>
  );
};
