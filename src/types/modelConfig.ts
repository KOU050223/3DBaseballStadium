import { Vector3, Euler } from 'three';

export interface ModelConfig {
  position?: Vector3;
  rotation?: Euler;
  scale?: number;
  modelPath: string;
  visible?: boolean;
  debugMode?: boolean;
}

// モデル設定の型定義
export interface ModelTransform {
  x: number;
  y: number;
  z: number;
}

export interface ModelConfiguration {
  position: ModelTransform;
  rotation: ModelTransform;
  scale: number;
}