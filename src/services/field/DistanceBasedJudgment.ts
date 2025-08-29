import { Vector3 } from 'three';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { PlayResult } from '@/types/game/gameState';

/**
 * 飛距離に基づく打球判定システム
 * ユーザー（バット）の座標から球の着地点までの距離を計算し、
 * 距離に応じて安打の種類を判定する
 */
export class DistanceBasedJudgment {
  private playerPosition: Vector3;
  
  // 飛距離による判定基準（メートル）
  private static readonly DISTANCE_THRESHOLDS = {
    GROUND_OUT: 25,      // ゴロアウト
    INFIELD_SINGLE: 30,  // 内野安打
    OUTFIELD_SINGLE: 45, // 外野安打
    DOUBLE: 70,          // 二塁打
    TRIPLE: 95,          // 三塁打
    HOMERUN: 130         // ホームラン
  } as const;

  constructor(playerPosition: Vector3) {
    this.playerPosition = playerPosition.clone();
  }

  /**
   * プレイヤー座標を更新
   */
  public updatePlayerPosition(newPosition: Vector3): void {
    this.playerPosition.copy(newPosition);
  }

  /**
   * 球の着地点から飛距離を計算し、判定を行う
   */
  public judgeByDistance(
    ballLandingPosition: Vector3,
    _ballVelocity?: Vector3
  ): HitJudgmentResult {
    // 水平距離を計算（Y軸は除外）
    const horizontalDistance = this.calculateHorizontalDistance(ballLandingPosition);
    
    // 高さも考慮した実際の距離
    const actualDistance = this.playerPosition.distanceTo(ballLandingPosition);
    
    // ファウル判定（X軸の符号で左右ファウルを判定）
    if (this.isFoulTerritory(ballLandingPosition)) {
      const foulResult = {
        judgmentType: 'foul' as const,
        zoneId: 'foul-territory',
        position: ballLandingPosition.clone(),
        metadata: {
          distance: horizontalDistance,
          height: ballLandingPosition.y,
          actualDistance,
          playerPosition: this.playerPosition.clone(),
          calculationMethod: 'distance-based'
        }
      };

      // ファウル判定のコンソール出力
      console.log(`⚾ 飛距離判定結果: FOUL`, {
        飛距離: `${horizontalDistance.toFixed(1)}m`,
        高さ: `${ballLandingPosition.y.toFixed(1)}m`,
        着地点: `(${ballLandingPosition.x.toFixed(1)}, ${ballLandingPosition.y.toFixed(1)}, ${ballLandingPosition.z.toFixed(1)})`,
        打者位置: `(${this.playerPosition.x.toFixed(1)}, ${this.playerPosition.y.toFixed(1)}, ${this.playerPosition.z.toFixed(1)})`,
        理由: this.getFoulReason(ballLandingPosition)
      });

      return foulResult;
    }

    // 飛距離による判定
    const judgmentType = this.getJudgmentByDistance(horizontalDistance, ballLandingPosition.y);
    
    const result = {
      judgmentType: judgmentType as PlayResult,
      zoneId: `distance-${judgmentType}`,
      position: ballLandingPosition.clone(),
      metadata: {
        distance: horizontalDistance,
        height: ballLandingPosition.y,
        actualDistance,
        playerPosition: this.playerPosition.clone(),
        calculationMethod: 'distance-based'
      }
    };

    // 詳細なコンソール出力
    console.log(`⚾ 飛距離判定結果: ${judgmentType.toUpperCase()}`, {
      飛距離: `${horizontalDistance.toFixed(1)}m`,
      高さ: `${ballLandingPosition.y.toFixed(1)}m`,
      実距離: `${actualDistance.toFixed(1)}m`,
      着地点: `(${ballLandingPosition.x.toFixed(1)}, ${ballLandingPosition.y.toFixed(1)}, ${ballLandingPosition.z.toFixed(1)})`,
      打者位置: `(${this.playerPosition.x.toFixed(1)}, ${this.playerPosition.y.toFixed(1)}, ${this.playerPosition.z.toFixed(1)})`
    });

    return result;
  }

  /**
   * 水平距離を計算（XZ平面での距離）
   */
  private calculateHorizontalDistance(ballPosition: Vector3): number {
    const playerHorizontal = new Vector3(this.playerPosition.x, 0, this.playerPosition.z);
    const ballHorizontal = new Vector3(ballPosition.x, 0, ballPosition.z);
    return playerHorizontal.distanceTo(ballHorizontal);
  }

  /**
   * ファウルテリトリー判定
   * 現在のフィールド定義に基づいて簡易的に判定
   */
  private isFoulTerritory(ballPosition: Vector3): boolean {
    // 極端な左右（|X| > 40）はファウル
    if (Math.abs(ballPosition.x) > 40) {
      return true;
    }
    
    // 後方（Z < 0）はファウル
    if (ballPosition.z < 0) {
      return true;
    }
    
    // フェアテリトリー内の左右端判定（角度による）
    const angle = Math.atan2(ballPosition.x, ballPosition.z);
    const maxAngle = Math.PI / 4; // 45度
    
    return Math.abs(angle) > maxAngle;
  }

  /**
   * ファウルの理由を取得（デバッグ用）
   */
  private getFoulReason(ballPosition: Vector3): string {
    if (Math.abs(ballPosition.x) > 40) {
      return ballPosition.x > 0 ? '右側ファウルライン越え' : '左側ファウルライン越え';
    }
    
    if (ballPosition.z < 0) {
      return 'バックスクリーン方向';
    }
    
    const angle = Math.atan2(ballPosition.x, ballPosition.z);
    const maxAngle = Math.PI / 4;
    
    if (Math.abs(angle) > maxAngle) {
      return angle > 0 ? '右ファウル角度' : '左ファウル角度';
    }
    
    return '不明';
  }

  /**
   * 飛距離による判定タイプの決定
   */
  private getJudgmentByDistance(distance: number, height: number): string {
    let judgmentType: string;
    let reason: string;

    // 高いフライボール（高度5m以上）は特別扱い
    if (height > 5) {
      if (distance < DistanceBasedJudgment.DISTANCE_THRESHOLDS.OUTFIELD_SINGLE) {
        judgmentType = 'out';
        reason = 'フライアウト（高度5m以上）';
      } else {
        judgmentType = this.getBasicDistanceJudgment(distance);
        reason = `高いフライ（${distance.toFixed(1)}m）`;
      }
    } else {
      judgmentType = this.getBasicDistanceJudgment(distance, height);
      reason = this.getJudgmentReason(distance, height);
    }

    // 判定詳細をコンソール出力
    console.log(`🎯 判定詳細: ${judgmentType.toUpperCase()}`, {
      距離: `${distance.toFixed(1)}m`,
      高さ: `${height.toFixed(1)}m`,
      理由: reason
    });

    return judgmentType;
  }

  /**
   * 基本的な距離判定
   */
  private getBasicDistanceJudgment(distance: number, height?: number): string {
    if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.HOMERUN) {
      return 'homerun';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.TRIPLE) {
      return 'triple';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.DOUBLE) {
      return 'double';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.OUTFIELD_SINGLE) {
      return 'single';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.INFIELD_SINGLE) {
      // 内野安打判定（低い打球）
      if (height !== undefined && height < 2) {
        return 'single';
      } else {
        return 'out'; // 内野フライ
      }
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.GROUND_OUT) {
      // 25-30mは低い打球なら内野安打、高い打球ならアウト
      if (height !== undefined && height < 2) {
        return 'single';
      } else {
        return 'out';
      }
    } else {
      return 'out';
    }
  }

  /**
   * 判定理由を取得
   */
  private getJudgmentReason(distance: number, height: number): string {
    if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.HOMERUN) {
      return 'ホームラン距離';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.TRIPLE) {
      return '三塁打距離';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.DOUBLE) {
      return '二塁打距離';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.OUTFIELD_SINGLE) {
      return '外野安打距離';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.INFIELD_SINGLE) {
      return height < 2 ? '内野安打（低い打球）' : '内野フライ';
    } else if (distance >= DistanceBasedJudgment.DISTANCE_THRESHOLDS.GROUND_OUT) {
      return height < 2 ? '内野ゴロ安打' : '内野ゴロアウト';
    } else {
      return '近距離アウト';
    }
  }

  /**
   * 判定基準の閾値を取得
   */
  public static getDistanceThresholds() {
    return { ...DistanceBasedJudgment.DISTANCE_THRESHOLDS };
  }

  /**
   * デバッグ情報の取得
   */
  public getDebugInfo(): {
    playerPosition: Vector3;
    thresholds: typeof DistanceBasedJudgment.DISTANCE_THRESHOLDS;
  } {
    return {
      playerPosition: this.playerPosition.clone(),
      thresholds: DistanceBasedJudgment.getDistanceThresholds()
    };
  }
}