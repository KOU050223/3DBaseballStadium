import { Vector3 } from 'three';
import { BallTrajectory, HitJudgmentResult, HitJudgmentConfig } from '@/types/field/hitJudgment';
import { StadiumFieldMap } from './StadiumFieldMap';

/**
 * ボール軌道追跡と落下判定システム
 * バット衝突後のボールを追跡し、落下地点で自動判定を実行
 */
export class BallFlightSystem {
  private trackedBalls: Map<string, BallTrajectory> = new Map();
  private stadiumMap: StadiumFieldMap;
  private config: HitJudgmentConfig;

  constructor(stadiumMap: StadiumFieldMap, config?: Partial<HitJudgmentConfig>) {
    this.stadiumMap = stadiumMap;
    this.config = {
      enableTrajectoryLogging: false,
      groundLevel: -1,
      maxTrackingTime: 10,
      minVelocityThreshold: 0.1,
      ...config
    };
  }

  /**
   * ボールの追跡を開始
   * バット衝突時や新しいボール生成時に呼び出し
   */
  public startTracking(
    ballId: string,
    initialPosition: Vector3,
    initialVelocity: Vector3
  ): void {
    const trajectory: BallTrajectory = {
      id: ballId,
      startPosition: initialPosition.clone(),
      currentPosition: initialPosition.clone(),
      velocity: initialVelocity.clone(),
      isTracking: true,
      hasLanded: false,
      trajectory: this.config.enableTrajectoryLogging ? [initialPosition.clone()] : undefined
    };

    this.trackedBalls.set(ballId, trajectory);
  }

  /**
   * ボール位置の更新
   * 毎フレーム呼び出される
   */
  public updateBallPosition(
    ballId: string,
    newPosition: Vector3,
    newVelocity: Vector3,
    deltaTime: number
  ): HitJudgmentResult | null {
    const trajectory = this.trackedBalls.get(ballId);
    if (!trajectory || !trajectory.isTracking || trajectory.hasLanded) {
      return null;
    }

    // 位置と速度の更新
    trajectory.currentPosition.copy(newPosition);
    trajectory.velocity.copy(newVelocity);

    // 軌道ログ（デバッグ用）
    if (this.config.enableTrajectoryLogging && trajectory.trajectory) {
      trajectory.trajectory.push(newPosition.clone());
    }

    // 落下判定
    if (this.shouldConsiderLanded(trajectory, deltaTime)) {
      return this.processBallLanding(trajectory);
    }

    // 追跡時間制限チェック
    if (this.isTrackingTimeExceeded(trajectory)) {
      this.stopTracking(ballId);
    }

    return null;
  }

  /**
   * 落下判定の条件チェック
   */
  private shouldConsiderLanded(trajectory: BallTrajectory, deltaTime: number): boolean {
    const pos = trajectory.currentPosition;
    const vel = trajectory.velocity;

    // 地面レベルに到達
    if (pos.y <= this.config.groundLevel) {
      return true;
    }

    // 速度が閾値以下（ほぼ停止）
    if (vel.length() < this.config.minVelocityThreshold) {
      return true;
    }

    // Y方向の速度が正から負に転じ、かつ低高度（放物線の頂点を過ぎて降下中）
    if (vel.y < 0 && pos.y < 3 && pos.y > this.config.groundLevel) {
      return true;
    }

    return false;
  }

  /**
   * 追跡時間制限チェック
   */
  private isTrackingTimeExceeded(trajectory: BallTrajectory): boolean {
    // 簡易実装：軌道配列の長さで時間を推定
    if (this.config.enableTrajectoryLogging && trajectory.trajectory) {
      return trajectory.trajectory.length > this.config.maxTrackingTime * 60; // 60FPS想定
    }
    return false;
  }

  /**
   * ボール落下時の処理
   */
  private processBallLanding(trajectory: BallTrajectory): HitJudgmentResult | null {
    if (trajectory.hasLanded) return null;

    trajectory.hasLanded = true;
    trajectory.isTracking = false;

    // フィールドマップで判定実行
    const judgmentResult = this.stadiumMap.evaluateBallLanding(
      trajectory.currentPosition,
      {
        velocity: trajectory.velocity,
        ballId: trajectory.id
      }
    );

    if (judgmentResult) {
      trajectory.landingResult = judgmentResult;
      
      // コールバック実行（将来的にイベントシステムに拡張可能）
      this.onBallLanding(judgmentResult, trajectory);
    }

    return judgmentResult;
  }

  /**
   * ボール落下時のコールバック
   * 外部システム（GameStore等）との連携ポイント
   */
  private onBallLanding(result: HitJudgmentResult, trajectory: BallTrajectory): void {
    // 現在は何もしないが、将来的にイベントエミッターやコールバック機能を追加
    console.log(`Ball ${trajectory.id} landed: ${result.judgmentType} in zone ${result.zoneId}`);
  }

  /**
   * 特定ボールの追跡停止
   */
  public stopTracking(ballId: string): boolean {
    const trajectory = this.trackedBalls.get(ballId);
    if (trajectory) {
      trajectory.isTracking = false;
      return true;
    }
    return false;
  }

  /**
   * ボール情報の削除
   */
  public removeBall(ballId: string): boolean {
    return this.trackedBalls.delete(ballId);
  }

  /**
   * 全ボールの追跡停止
   */
  public stopAllTracking(): void {
    this.trackedBalls.forEach(trajectory => {
      trajectory.isTracking = false;
    });
  }

  /**
   * 追跡中ボール一覧の取得
   */
  public getTrackedBalls(): Map<string, BallTrajectory> {
    return new Map(this.trackedBalls);
  }

  /**
   * 特定ボールの軌道情報取得
   */
  public getBallTrajectory(ballId: string): BallTrajectory | undefined {
    return this.trackedBalls.get(ballId);
  }

  /**
   * 統計情報の取得
   */
  public getStatistics(): {
    totalTracked: number;
    activeTracking: number;
    landed: number;
    averageTrajectoryLength?: number;
  } {
    let activeTracking = 0;
    let landed = 0;
    let totalTrajectoryPoints = 0;
    let trajectoriesWithLog = 0;

    this.trackedBalls.forEach(trajectory => {
      if (trajectory.isTracking) activeTracking++;
      if (trajectory.hasLanded) landed++;
      
      if (trajectory.trajectory) {
        totalTrajectoryPoints += trajectory.trajectory.length;
        trajectoriesWithLog++;
      }
    });

    return {
      totalTracked: this.trackedBalls.size,
      activeTracking,
      landed,
      averageTrajectoryLength: trajectoriesWithLog > 0 
        ? totalTrajectoryPoints / trajectoriesWithLog 
        : undefined
    };
  }

  /**
   * 設定の更新
   */
  public updateConfig(newConfig: Partial<HitJudgmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * デバッグ情報の取得
   */
  public getDebugInfo(): {
    config: HitJudgmentConfig;
    statistics: ReturnType<typeof this.getStatistics>;
    activeBalls: Array<{
      id: string;
      position: Vector3;
      velocity: Vector3;
      isTracking: boolean;
      hasLanded: boolean;
    }>;
  } {
    const activeBalls = Array.from(this.trackedBalls.values()).map(trajectory => ({
      id: trajectory.id,
      position: trajectory.currentPosition.clone(),
      velocity: trajectory.velocity.clone(),
      isTracking: trajectory.isTracking,
      hasLanded: trajectory.hasLanded
    }));

    return {
      config: this.config,
      statistics: this.getStatistics(),
      activeBalls
    };
  }
}