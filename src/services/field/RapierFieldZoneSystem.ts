import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { FieldZone } from '@/types/field/fieldZone';
import { createFieldZoneMap } from '@/constants/field/FieldZoneDefinitions';
import { DistanceBasedJudgment } from './DistanceBasedJudgment';

/**
 * Rapier物理エンジンベースのフィールドゾーン判定システム
 * RigidBodyの位置とColliderベースの判定を活用
 */
export class RapierFieldZoneSystem {
  private zones: Map<string, FieldZone>;
  private distanceJudgment: DistanceBasedJudgment;
  private useDistanceBasedJudgment: boolean = true;
  private trackedBalls: Map<string, {
    rigidBody: RapierRigidBody;
    hasLanded: boolean;
    startTime: number;
    lastPosition: Vector3;
    landingCallback?: (result: HitJudgmentResult) => void;
  }> = new Map();
  
  private landingThreshold = {
    velocityY: 0.5,    // Y方向の速度閾値（上昇→下降の転換点）
    groundLevel: -1,   // 地面レベル
    minHeight: 0.5,    // 最小高度（地面近く）
    maxTrackingTime: 15000, // 最大追跡時間（ミリ秒）
  };

  constructor(playerPosition?: Vector3) {
    this.zones = createFieldZoneMap();
    const defaultPlayerPosition = playerPosition || new Vector3(1.6, 1.4, 0);
    this.distanceJudgment = new DistanceBasedJudgment(defaultPlayerPosition);
  }

  /**
   * ボールの追跡開始（RigidBody参照を保持）
   */
  public startTracking(
    ballId: string, 
    rigidBody: RapierRigidBody,
    landingCallback?: (result: HitJudgmentResult) => void
  ): void {
    const position = rigidBody.translation();
    
    this.trackedBalls.set(ballId, {
      rigidBody,
      hasLanded: false,
      startTime: Date.now(),
      lastPosition: new Vector3(position.x, position.y, position.z),
      landingCallback
    });
  }

  /**
   * フレーム毎の更新処理
   */
  public update(): void {
    this.trackedBalls.forEach((tracker, ballId) => {
      if (tracker.hasLanded) return;

      const currentTime = Date.now();
      const position = tracker.rigidBody.translation();
      const velocity = tracker.rigidBody.linvel();
      
      const currentPosition = new Vector3(position.x, position.y, position.z);
      const currentVelocity = new Vector3(velocity.x, velocity.y, velocity.z);

      // 落下判定
      if (this.shouldConsiderLanded(currentPosition, currentVelocity, tracker.lastPosition)) {
        this.processBallLanding(ballId, currentPosition, currentVelocity);
        tracker.hasLanded = true;
      }

      // タイムアウトチェック
      if (currentTime - tracker.startTime > this.landingThreshold.maxTrackingTime) {
        console.warn(`Ball ${ballId} tracking timeout`);
        this.stopTracking(ballId);
      }

      tracker.lastPosition.copy(currentPosition);
    });
  }

  /**
   * 落下判定の条件チェック（Rapierの物理特性を活用）
   */
  private shouldConsiderLanded(
    position: Vector3, 
    velocity: Vector3, 
    lastPosition: Vector3
  ): boolean {
    // 地面レベルに到達
    if (position.y <= this.landingThreshold.groundLevel) {
      return true;
    }

    // Y方向の速度が下向きで、低高度かつ速度が小さい
    if (velocity.y < -this.landingThreshold.velocityY && 
        position.y < this.landingThreshold.minHeight && 
        position.y > this.landingThreshold.groundLevel) {
      return true;
    }

    // 速度がほぼゼロ（静止状態）
    if (velocity.length() < 0.1) {
      return true;
    }

    // Y座標が前フレームより下がっていて、かつ低高度
    if (position.y < lastPosition.y && position.y < 2.0) {
      return true;
    }

    return false;
  }

  /**
   * ボール落下時の処理
   */
  private processBallLanding(ballId: string, position: Vector3, velocity: Vector3): void {
    const tracker = this.trackedBalls.get(ballId);
    
    if (!tracker) return;

    let judgmentResult: HitJudgmentResult;

    if (this.useDistanceBasedJudgment) {
      // 距離ベース判定を使用
      judgmentResult = this.distanceJudgment.judgeByDistance(position, velocity);
    } else {
      // 従来のゾーンベース判定を使用
      const zone = this.getZoneAtPosition(position);
      judgmentResult = {
        judgmentType: zone?.judgmentType || 'foul',
        position: position.clone(),
        zoneId: zone?.id || 'out-of-bounds',
        timestamp: Date.now(),
        metadata: {
          distance: position.length(),
          height: position.y,
          velocity: velocity.clone(),
          landingSpeed: velocity.length()
        }
      };
      
      // 従来システムのログ出力
      console.log(`⚾ Rapier Ball Landing: ${judgmentResult.judgmentType} in ${judgmentResult.zoneId}`, {
        position: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`,
        velocity: velocity.length().toFixed(1),
        distance: position.length().toFixed(1)
      });
    }

    // コールバック実行
    tracker.landingCallback?.(judgmentResult);
  }

  /**
   * 位置からゾーンを取得（空間分割最適化版）
   */
  private getZoneAtPosition(position: Vector3): FieldZone | null {
    // 優先度順でチェック
    const sortedZones = Array.from(this.zones.values())
      .sort((a, b) => b.priority - a.priority);
    
    for (const zone of sortedZones) {
      if (this.isPositionInZone(position, zone)) {
        return zone;
      }
    }
    
    return null;
  }

  /**
   * 位置がゾーン内にあるかチェック
   */
  private isPositionInZone(position: Vector3, zone: FieldZone): boolean {
    const { min, max } = zone.boundingBox;
    return position.x >= min.x && position.x <= max.x &&
           position.y >= min.y && position.y <= max.y &&
           position.z >= min.z && position.z <= max.z;
  }

  /**
   * ボール追跡停止
   */
  public stopTracking(ballId: string): boolean {
    return this.trackedBalls.delete(ballId);
  }

  /**
   * 特定ボールの追跡情報取得
   */
  public getTrackingInfo(ballId: string) {
    const tracker = this.trackedBalls.get(ballId);
    if (!tracker) return null;

    const position = tracker.rigidBody.translation();
    const velocity = tracker.rigidBody.linvel();

    return {
      ballId,
      position: new Vector3(position.x, position.y, position.z),
      velocity: new Vector3(velocity.x, velocity.y, velocity.z),
      hasLanded: tracker.hasLanded,
      trackingTime: Date.now() - tracker.startTime
    };
  }

  /**
   * 全ゾーンの取得
   */
  public getAllZones(): Map<string, FieldZone> {
    return new Map(this.zones);
  }

  /**
   * プレイヤー座標の更新
   */
  public updatePlayerPosition(newPosition: Vector3): void {
    this.distanceJudgment.updatePlayerPosition(newPosition);
  }

  /**
   * 判定方式の切り替え
   */
  public setUseDistanceBasedJudgment(use: boolean): void {
    this.useDistanceBasedJudgment = use;
  }

  /**
   * 設定の更新
   */
  public updateLandingThreshold(updates: Partial<typeof this.landingThreshold>): void {
    this.landingThreshold = { ...this.landingThreshold, ...updates };
  }

  /**
   * デバッグ統計
   */
  public getStatistics() {
    return {
      totalTrackedBalls: this.trackedBalls.size,
      landedBalls: Array.from(this.trackedBalls.values()).filter(t => t.hasLanded).length,
      activeBalls: Array.from(this.trackedBalls.values()).filter(t => !t.hasLanded).length,
      totalZones: this.zones.size,
      landingThreshold: this.landingThreshold
    };
  }

  /**
   * 全追跡のリセット
   */
  public reset(): void {
    this.trackedBalls.clear();
  }
}