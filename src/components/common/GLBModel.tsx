'use client';

import React from 'react';
import { useGLBLoader } from '@/hooks/useGLBLoader';

interface GLBModelProps {
  modelPath: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const GLBModel: React.FC<GLBModelProps> = ({
  modelPath,
  scale,
  position,
  rotation,
  onLoad
}) => {
  const glb = useGLBLoader({
    modelPath,
    scale,
    position,
    rotation,
    onLoad
  });

  if (!glb) return null;

  return <primitive object={glb} />;
};
