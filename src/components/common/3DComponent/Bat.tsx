'use client';

import { useRef, Suspense, useState, useEffect } from 'react';
import { Group, Vector3, Euler } from 'three';
import { GLBModel } from '@/components/common/GLBModel';
import { FallbackBat } from '@/components/common/3DComponent/FallbackBat';
import type { DebugInfo } from '@/types/debug';
import { ModelConfig } from '@/types/modelConfig';

export interface BatProps extends ModelConfig {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onDebugInfo?: (info: DebugInfo) => void;
}

export const Bat: React.FC<BatProps> = ({
  position = new Vector3(0, 0, 0),
  rotation = new Euler(0, 0, 0),
  scale = 1,
  modelPath = "/models/BaseballBat.glb",
  visible = true,
  onLoad,
  onError,
  onDebugInfo
}) => {
  const groupRef = useRef<Group>(null);
  const [glbLoaded, setGlbLoaded] = useState(false);
  const [glbError, setGlbError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // デバッグ情報を更新
  useEffect(() => {
    onDebugInfo?.({
      glbLoaded,
      glbError,
      loadingTimeout,
      modelPath
    });
  }, [glbLoaded, glbError, loadingTimeout, modelPath, onDebugInfo]);

  // 5秒後にタイムアウトしてフォールバックを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!glbLoaded && !glbError) {
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [glbLoaded, glbError]);

  const handleLoad = () => {
    setGlbLoaded(true);
    onLoad?.();
  };

  const handleError = (error: Error) => {
    setGlbError(true);
    onError?.(error);
  };

  // 表示するコンテンツを決定
  const renderContent = () => {
    // エラーまたはタイムアウトの場合はフォールバック表示
    if (glbError || loadingTimeout) {
      return <FallbackBat color="#8B4513" />;
    }
    
    // 通常の読み込み試行
    return (
      <Suspense fallback={<FallbackBat color="#666666" />}>
          <GLBModel 
            modelPath={modelPath}
            onLoad={handleLoad}
            onError={handleError}
          />
      </Suspense>
    );
  };

  return (
    <group 
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={[scale, scale, scale]}
      visible={visible}
    >
      {renderContent()}
    </group>
  );
};