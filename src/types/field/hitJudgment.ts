import { Vector3 } from 'three';
import { PlayResult } from '@/types/game/gameState';

// 打球判定結果
export interface HitJudgmentResult {
  judgmentType: PlayResult;
  position: Vector3;
  zoneId: string;
  timestamp: number;
  metadata?: {
    distance?: number;          // ホームプレートからの距離
    height?: number;           // 落下時の高さ
    velocity?: Vector3;        // 落下時の速度
  };
}

// ボール軌道追跡情報
export interface BallTrajectory {
  id: string;
  startPosition: Vector3;
  currentPosition: Vector3;
  velocity: Vector3;
  isTracking: boolean;
  hasLanded: boolean;
  landingResult?: HitJudgmentResult;
  trajectory?: Vector3[];      // 軌道履歴（デバッグ用）
}

// 打球判定システムの設定
export interface HitJudgmentConfig {
  enableTrajectoryLogging: boolean;
  groundLevel: number;          // 地面レベル（Y座標）
  maxTrackingTime: number;      // 最大追跡時間（秒）
  minVelocityThreshold: number; // 速度閾値（これ以下で停止判定）
}