import { Vector3 } from 'three';
import { StadiumFieldMap } from './StadiumFieldMap';
import { BallFlightSystem } from './BallFlightSystem';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { FieldZone } from '@/types/field/fieldZone';

/**
 * フィールドゾーン判定の統合管理システム
 * StadiumFieldMapとBallFlightSystemを統合し、
 * 外部システム（GameStore等）への統一インターフェースを提供
 */
export class FieldZoneManager {
  private stadiumMap: StadiumFieldMap;
  private ballFlightSystem: BallFlightSystem;
  private eventCallbacks: {
    onHitJudgment?: (result: HitJudgmentResult) => void;
    onBallLanding?: (ballId: string, position: Vector3, judgmentType: string) => void;
  } = {};

  constructor() {
    this.stadiumMap = new StadiumFieldMap();
    this.ballFlightSystem = new BallFlightSystem(this.stadiumMap, {
      enableTrajectoryLogging: false, // パフォーマンス重視でデフォルトはoff
      groundLevel: -1,
      maxTrackingTime: 15, // 15秒で追跡タイムアウト
      minVelocityThreshold: 0.5
    });
  }

  /**
   * ボールの追跡開始
   * バット衝突後やボール生成時に呼び出し
   */
  public startBallTracking(
    ballId: string,
    initialPosition: Vector3,
    initialVelocity: Vector3
  ): void {
    this.ballFlightSystem.startTracking(ballId, initialPosition, initialVelocity);
  }

  /**
   * ボール位置の更新と判定実行
   * 毎フレーム呼び出される（Ball.tsxから）
   */
  public updateBallAndCheck(
    ballId: string,
    position: Vector3,
    velocity: Vector3,
    deltaTime: number
  ): HitJudgmentResult | null {
    const result = this.ballFlightSystem.updateBallPosition(
      ballId,
      position,
      velocity,
      deltaTime
    );

    // 判定が発生した場合はコールバックを実行
    if (result) {
      this.handleHitJudgment(result);
    }

    return result;
  }

  /**
   * 打球判定結果の処理
   */
  private handleHitJudgment(result: HitJudgmentResult): void {
    // イベントコールバックの実行
    if (this.eventCallbacks.onHitJudgment) {
      this.eventCallbacks.onHitJudgment(result);
    }

    if (this.eventCallbacks.onBallLanding) {
      this.eventCallbacks.onBallLanding(
        result.zoneId,
        result.position,
        result.judgmentType
      );
    }

    // コンソールログ（デバッグ用）
    console.log(`⚾ Hit Judgment: ${result.judgmentType} in ${result.zoneId} at (${result.position.x.toFixed(1)}, ${result.position.y.toFixed(1)}, ${result.position.z.toFixed(1)})`);
  }

  /**
   * 即座の位置判定（軌道追跡なし）
   * 静的な位置チェックが必要な場合に使用
   */
  public getZoneAtPosition(position: Vector3): FieldZone | null {
    return this.stadiumMap.getZoneAtPosition(position);
  }

  /**
   * ボール追跡の停止
   */
  public stopBallTracking(ballId: string): boolean {
    return this.ballFlightSystem.stopTracking(ballId);
  }

  /**
   * ボール情報の削除
   */
  public removeBall(ballId: string): boolean {
    return this.ballFlightSystem.removeBall(ballId);
  }

  /**
   * イベントコールバックの設定
   */
  public setEventCallbacks(callbacks: {
    onHitJudgment?: (result: HitJudgmentResult) => void;
    onBallLanding?: (ballId: string, position: Vector3, judgmentType: string) => void;
  }): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * ゾーンの動的追加
   */
  public addCustomZone(zone: FieldZone): void {
    this.stadiumMap.addZone(zone);
  }

  /**
   * ゾーンの削除
   */
  public removeZone(zoneId: string): boolean {
    return this.stadiumMap.removeZone(zoneId);
  }

  /**
   * ゾーンの更新
   */
  public updateZone(zoneId: string, updates: Partial<FieldZone>): boolean {
    return this.stadiumMap.updateZone(zoneId, updates);
  }

  /**
   * 全ゾーンの取得（デバッグ・可視化用）
   */
  public getAllZones(): Map<string, FieldZone> {
    return this.stadiumMap.getAllZones();
  }

  /**
   * デバッグモード設定
   */
  public setDebugMode(enabled: boolean): void {
    this.ballFlightSystem.updateConfig({
      enableTrajectoryLogging: enabled
    });
  }

  /**
   * パフォーマンス統計の取得
   */
  public getPerformanceStats(): {
    fieldMap: ReturnType<typeof StadiumFieldMap.prototype.getStatistics>;
    ballFlight: ReturnType<typeof BallFlightSystem.prototype.getStatistics>;
  } {
    return {
      fieldMap: this.stadiumMap.getStatistics(),
      ballFlight: this.ballFlightSystem.getStatistics()
    };
  }

  /**
   * 総合デバッグ情報
   */
  public getDebugInfo(): {
    fieldMap: ReturnType<typeof StadiumFieldMap.prototype.getDebugInfo>;
    ballFlight: ReturnType<typeof BallFlightSystem.prototype.getDebugInfo>;
    eventCallbacks: string[];
  } {
    return {
      fieldMap: this.stadiumMap.getDebugInfo(),
      ballFlight: this.ballFlightSystem.getDebugInfo(),
      eventCallbacks: Object.keys(this.eventCallbacks).filter(key => 
        this.eventCallbacks[key as keyof typeof this.eventCallbacks] !== undefined
      )
    };
  }

  /**
   * システムリセット
   */
  public reset(): void {
    this.ballFlightSystem.stopAllTracking();
    // 必要に応じて他のリセット処理を追加
  }

  /**
   * 設定の一括更新
   */
  public updateSettings(settings: {
    fieldMapConfig?: Parameters<typeof StadiumFieldMap.prototype.constructor>[0];
    ballFlightConfig?: Parameters<typeof BallFlightSystem.prototype.updateConfig>[0];
  }): void {
    if (settings.ballFlightConfig) {
      this.ballFlightSystem.updateConfig(settings.ballFlightConfig);
    }
    
    // フィールドマップの設定更新は再構築が必要なため、現状では未実装
    // 将来的に実装する場合は、StadiumFieldMapにconfig更新メソッドを追加
  }
}

// シングルトンインスタンス（オプション）
let globalFieldZoneManager: FieldZoneManager | null = null;

/**
 * グローバルなFieldZoneManagerインスタンスを取得
 * アプリケーション全体で単一のインスタンスを共有したい場合に使用
 */
export function getFieldZoneManager(): FieldZoneManager {
  if (!globalFieldZoneManager) {
    globalFieldZoneManager = new FieldZoneManager();
  }
  return globalFieldZoneManager;
}

/**
 * グローバルインスタンスのリセット（テスト用）
 */
export function resetFieldZoneManager(): void {
  globalFieldZoneManager = null;
}