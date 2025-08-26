'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/future/modelTest/ErrorBoundary';
import BaseballStadium from '@/components/future/modelTest/BaseballStadium';
import { Bat } from '@/components/future/modelTest/Bat';

interface SceneProps {
  debugMode?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [stadiumScale, setStadiumScale] = useState<number>(1);
  const [stadiumPosition, setStadiumPosition] = useState<Vector3>(new Vector3(0, -10, 0));
  const [stadiumRotation, setStadiumRotation] = useState<Euler>(new Euler(0, 0, 0));
  
  const [batScale, setBatScale] = useState<number>(1);
  const [batPosition, setBatPosition] = useState<Vector3>(new Vector3(0, 0, 0));
  const [batRotation, setBatRotation] = useState<Euler>(new Euler(0, 0, 0));

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
              onLoad={() => console.log('Stadium loaded in integrated scene')}
            />
            <Bat 
              position={batPosition}
              rotation={batRotation}
              scale={batScale}
              modelPath="/models/bat/IronBat.fbx"
              onLoad={() => console.log('Bat loaded in integrated scene')}
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
            <div className="text-yellow-300 mb-2 font-semibold">スタジアム</div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Scale</div>
              <input
                type="range" min="0.1" max="3" step="0.1" value={stadiumScale}
                onChange={(e) => setStadiumScale(+e.target.value)}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{stadiumScale.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Position Y</div>
              <input
                type="range" min="-20" max="5" step="0.5" value={stadiumPosition.y}
                onChange={(e) => setStadiumPosition(new Vector3(stadiumPosition.x, +e.target.value, stadiumPosition.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{stadiumPosition.y.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Rotation Y</div>
              <input
                type="range" min="0" max={Math.PI * 2} step="0.1" value={stadiumRotation.y}
                onChange={(e) => setStadiumRotation(new Euler(stadiumRotation.x, +e.target.value, stadiumRotation.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{Math.round(stadiumRotation.y * 180 / Math.PI)}°</div>
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
              <div className="text-gray-300 mb-1">Position Y</div>
              <input
                type="range" min="-5" max="10" step="0.1" value={batPosition.y}
                onChange={(e) => setBatPosition(new Vector3(batPosition.x, +e.target.value, batPosition.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{batPosition.y.toFixed(1)}</div>
            </div>
            <div className="mb-2">
              <div className="text-gray-300 mb-1">Rotation Y</div>
              <input
                type="range" min="0" max={Math.PI * 2} step="0.1" value={batRotation.y}
                onChange={(e) => setBatRotation(new Euler(batRotation.x, +e.target.value, batRotation.z))}
                className="w-full h-1"
              />
              <div className="text-xs text-gray-400">{Math.round(batRotation.y * 180 / Math.PI)}°</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};