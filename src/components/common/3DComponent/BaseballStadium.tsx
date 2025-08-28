'use client';

import React, { Suspense } from 'react';
import { GLBModel } from '@/components/common/GLBModel';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import { RigidBody } from '@react-three/rapier'; // Removed Collider
import { ModelConfig } from '@/types/modelConfig';
import { MODEL_CONFIG } from '@/constants/ModelPosition';

export interface BaseballStadiumProps extends ModelConfig {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  debugMode?: boolean;
}

const BaseballStadium: React.FC<BaseballStadiumProps> = ({
  position = MODEL_CONFIG.STADIUM.position,
  rotation = MODEL_CONFIG.STADIUM.rotation,
  scale = MODEL_CONFIG.STADIUM.scale,
  modelPath = "/models/BaseballStadium.glb",
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
          <RigidBody type="fixed" colliders="trimesh"> {/* Removed debug prop */}
            <GLBModel
              modelPath={modelPath}
              onLoad={onLoad}
              onError={onError}
            />
          </RigidBody> {/* Closed RigidBody */}
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
