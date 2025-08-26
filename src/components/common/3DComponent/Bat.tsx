'use client';

import { useRef, Suspense, useState, useEffect } from 'react';
import { Group, Vector3, Euler } from 'three';
import { FBXModel } from '@/components/common/FBXModel';
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
  modelPath = "/models/bat/IronBat.fbx",
  visible = true,
  onLoad,
  onError,
  onDebugInfo
}) => {
  const groupRef = useRef<Group>(null);
  const [fbxLoaded, setFbxLoaded] = useState(false);
  const [fbxError, setFbxError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // デバッグ情報を更新
  useEffect(() => {
    onDebugInfo?.({
      fbxLoaded,
      fbxError,
      loadingTimeout,
      modelPath
    });
  }, [fbxLoaded, fbxError, loadingTimeout, modelPath, onDebugInfo]);

  // 5秒後にタイムアウトしてフォールバックを表示
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!fbxLoaded && !fbxError) {
        setLoadingTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [fbxLoaded, fbxError]);

  const handleLoad = () => {
    setFbxLoaded(true);
    onLoad?.();
  };

  const handleError = (error: Error) => {
    setFbxError(true);
    onError?.(error);
  };

  // 表示するコンテンツを決定
  const renderContent = () => {
    // エラーまたはタイムアウトの場合はフォールバック表示
    if (fbxError || loadingTimeout) {
      return <FallbackBat color="#8B4513" />;
    }
    
    // 通常の読み込み試行
    return (
      <Suspense fallback={<FallbackBat color="#666666" />}>
          <FBXModel 
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