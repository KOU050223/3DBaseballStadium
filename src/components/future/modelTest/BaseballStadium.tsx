'use client';

import React, { Suspense } from 'react';
import { Vector3, Euler } from 'three';
import { GLBModel } from '@/components/common/GLBModel';
import { ErrorBoundary } from '@/components/future/modelTest/ErrorBoundary';
import { ModelConfig } from '@/types/modelConfig';

export interface BaseballStadiumProps extends ModelConfig {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  debugMode?: boolean;
}

const BaseballStadium: React.FC<BaseballStadiumProps> = ({
  position = new Vector3(0, -10, 0),
  rotation = new Euler(0, 0, 0),
  scale = 1,
  modelPath = "/models/baseball_stadium.glb",
  visible = true,
  onLoad,
  onError,
  debugMode = false
}) => {
  return (
    <group 
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={[scale, scale, scale]}
      visible={visible}
    >
      <ErrorBoundary 
        fallback={null}
      >
        <Suspense fallback={null}>
          <GLBModel
            modelPath={modelPath}
            onLoad={onLoad}
            onError={onError}
          />
        </Suspense>
      </ErrorBoundary>
      
      {debugMode && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="red" />
        </mesh>
      )}
    </group>
  );
};

export default BaseballStadium;
