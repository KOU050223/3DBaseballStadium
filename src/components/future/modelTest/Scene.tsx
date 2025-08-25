'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { FBXModel } from '@/components/common/FBXModel';
import { SimpleDebugPanel } from '@/components/common/SimpleDebugPanel';

interface SceneProps {
  debugMode?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
  const [scale, setScale] = useState<[number, number, number]>([1, 1, 1]);
  const [position, setPosition] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  
  const modelPath = "/models/bat/IronBat.fbx";

  return (
    <div className="w-full h-screen relative">
      <Canvas>
        <OrbitControls />
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Suspense fallback={null}>
          <FBXModel 
            modelPath={modelPath}
            scale={scale}
            position={position}
            rotation={rotation}
          />
        </Suspense>
      </Canvas>

      {debugMode && (
        <SimpleDebugPanel
          modelPath={modelPath}
          scale={scale}
          position={position}
          rotation={rotation}
          onScaleChange={setScale}
          onPositionChange={setPosition}
          onRotationChange={setRotation}
        />
      )}
    </div>
  );
};