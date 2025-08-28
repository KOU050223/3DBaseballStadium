import { Vector3, Euler } from 'three';

// 3Dモデルの設定定数
export const MODEL_CONFIG = {
  STADIUM: {
    position: new Vector3(0, -1, 50),
    rotation: new Euler(0, 0, 0),
    scale: 1
  },
  BAT: {
    position: new Vector3(1.6, 1.4, 0),
    rotation: new Euler(90, 0, 0),
    scale: 9
  },
  BALL: {
    position: new Vector3(0, 0, 0),
    rotation: new Euler(0, 0, 0),
    scale: 1
  }
} as const;
