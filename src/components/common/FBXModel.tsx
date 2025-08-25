'use client';

import React from 'react';
import { useFBXLoader } from '@/hooks/useFBXLoader';

interface FBXModelProps {
  modelPath: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const FBXModel: React.FC<FBXModelProps> = ({ 
  modelPath, 
  scale,
  position,
  rotation,
  onLoad, 
  onError 
}) => {
  const fbx = useFBXLoader({ 
    modelPath, 
    scale,
    position,
    rotation,
    onLoad, 
    onError 
  });

  if (!fbx) return null;

  return <primitive object={fbx} />;
};