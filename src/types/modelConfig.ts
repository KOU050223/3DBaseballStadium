import { Vector3, Euler } from 'three';

export interface ModelConfig {
  position?: Vector3;
  rotation?: Euler;
  scale?: number;
  modelPath: string;
  visible?: boolean;
  debugMode?: boolean;
}