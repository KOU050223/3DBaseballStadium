'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState, useRef } from 'react';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { BatController } from '@/components/common/3DComponent/BatController';
import { MODEL_CONFIG } from '@/constants/ModelPosition';
import { BattingMachine } from '@/components/common/3DComponent/BattingMachine'

interface SceneProps {
  debugMode?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [stadiumScale, setStadiumScale] = useState<number>(MODEL_CONFIG.STADIUM.scale);
  const [stadiumPosition, setStadiumPosition] = useState<Vector3>(MODEL_CONFIG.STADIUM.position);
  const [stadiumRotation, setStadiumRotation] = useState<Euler>(MODEL_CONFIG.STADIUM.rotation);

  const [batScale, setBatScale] = useState<number>(MODEL_CONFIG.BAT.scale);
  const [batPosition, setBatPosition] = useState<Vector3>(MODEL_CONFIG.BAT.position);

  // Define start and end rotations for the bat swing
  const startRotation = new Euler(-13 * Math.PI / 180, 0, 13 * Math.PI / 180);
  const endRotation = new Euler(-150 * Math.PI / 180, 0, 80 * Math.PI / 180);

  return (
    <div className="w-full h-full relative">
      <Canvas>
        <OrbitControls />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <BaseballStadium 
              debugMode={debugMode}
              position={stadiumPosition}
              rotation={stadiumRotation}
              scale={stadiumScale}
              modelPath="/models/BaseballStadium.glb"
              onLoad={() => console.log('Stadium loaded')}
            />
            <BatController
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
              ballSpeed={20}
              launchAngle={-2}
              autoStart={true}
              debugMode={debugMode}
            />
          </Suspense>
        </ErrorBoundary>
      </Canvas>

      {debugMode && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-3 rounded text-xs w-64 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">統合シーンデバッグ</span>
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
        </div>
      )}
    </div>
  );
};
