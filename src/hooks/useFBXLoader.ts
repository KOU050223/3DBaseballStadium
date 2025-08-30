'use client';

import { useEffect } from 'react';
import { useFBX } from '@react-three/drei';

interface UseFBXLoaderProps {
  modelPath: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onLoad?: () => void;
}

export const useFBXLoader = ({
  modelPath,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onLoad
}: UseFBXLoaderProps) => {
  const fbx = useFBX(modelPath);

  useEffect(() => {
    if (fbx) {
      // 基本的なトランスフォーム設定
      fbx.scale.set(scale[0], scale[1], scale[2]);
      fbx.position.set(position[0], position[1], position[2]);
      fbx.rotation.set(rotation[0], rotation[1], rotation[2]);
      onLoad?.();
    }
  }, [fbx, scale, position, rotation, onLoad]);

  return fbx;
};
