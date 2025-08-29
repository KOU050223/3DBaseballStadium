'use client';

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

interface UseGLBLoaderProps {
  modelPath: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onLoad?: () => void;
}

export const useGLBLoader = ({
  modelPath,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onLoad
}: UseGLBLoaderProps) => {

  // useGLTFは非同期でモデルをロードし、エラー時は例外を投げる
  // ErrorBoundaryとSuspenseでハンドリングされる
  const glb = useGLTF(modelPath);
  useEffect(() => {
    if (glb && glb.scene) {
      // 基本的なトランスフォーム設定
      glb.scene.scale.set(scale[0], scale[1], scale[2]);
      glb.scene.position.set(position[0], position[1], position[2]);
      glb.scene.rotation.set(rotation[0], rotation[1], rotation[2]);
      onLoad?.();
    } else if (glb) {
    }
  }, [glb, scale, position, rotation, onLoad, modelPath]);

  return glb?.scene ?? null;
};
