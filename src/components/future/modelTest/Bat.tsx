'use client';

import { useRef, Suspense, useState, useEffect } from 'react';
import { Group } from 'three';
import { FBXModel } from '@/components/common/FBXModel';
import { FallbackBat } from '@/components/future/modelTest/FallbackBat';
import type { DebugInfo } from '@/types/debug';
import { ModelConfig } from '@/types/modelConfig';

export interface BatProps extends ModelConfig {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onDebugInfo?: (info: DebugInfo) => void;
}

export const Bat: React.FC<BatProps> = ({
  position,
  rotation,
  scale = 1,
  modelPath,
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
        console.log('FBX loading timeout - showing fallback bat');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [fbxLoaded, fbxError]);

  const handleLoad = () => {
    console.log('Bat: handleLoad called, setting fbxLoaded to true');
    setFbxLoaded(true);
    onLoad?.();
    console.log('FBX bat loaded successfully');
  };

  const handleError = (error: Error) => {
    console.log('Bat: handleError called, setting fbxError to true');
    setFbxError(true);
    onError?.(error);
    console.error('FBX loading error, showing fallback:', error);
  };

  // 表示するコンテンツを決定
  const renderContent = () => {
    console.log('Bat: renderContent called - fbxLoaded:', fbxLoaded, 'fbxError:', fbxError, 'loadingTimeout:', loadingTimeout);
    
    // エラーまたはタイムアウトの場合はフォールバック表示
    if (fbxError || loadingTimeout) {
      console.log('Showing fallback bat due to error or timeout');
      return <FallbackBat color="#8B4513" />;
    }
    
    // 通常の読み込み試行
    console.log('Showing FBXModel with Suspense');
    return (
      <Suspense fallback={<FallbackBat color="#666666" />}>
          <FBXModel 
            modelPath={modelPath}
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            onLoad={handleLoad}
            onError={handleError}
          />
      </Suspense>
    );
  };

  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={visible}
    >
      {renderContent()}
    </group>
  );
};