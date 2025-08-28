'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { RapierFieldZoneSystem } from '@/services/field/RapierFieldZoneSystem';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { FieldZone } from '@/types/field/fieldZone';

/**
 * Rapier物理エンジン対応のフィールドゾーン管理カスタムフック
 * RigidBodyベースの追跡と物理的な落下判定を提供
 */
export const useRapierFieldZoneManager = () => {
  const systemRef = useRef<RapierFieldZoneSystem | null>(null);

  // システムの初期化
  useEffect(() => {
    if (!systemRef.current) {
      systemRef.current = new RapierFieldZoneSystem();
    }

    return () => {
      if (systemRef.current) {
        systemRef.current.reset();
      }
    };
  }, []);

  // フレーム毎の更新処理
  useFrame(() => {
    systemRef.current?.update();
  });

  /**
   * ボールの追跡開始（RigidBody参照を使用）
   */
  const startTracking = useCallback((
    ballId: string, 
    rigidBody: RapierRigidBody,
    onLanding?: (result: HitJudgmentResult) => void
  ) => {
    systemRef.current?.startTracking(ballId, rigidBody, onLanding);
  }, []);

  /**
   * ボール追跡停止
   */
  const stopTracking = useCallback((ballId: string): boolean => {
    return systemRef.current?.stopTracking(ballId) || false;
  }, []);

  /**
   * 特定ボールの追跡情報取得
   */
  const getTrackingInfo = useCallback((ballId: string) => {
    return systemRef.current?.getTrackingInfo(ballId) || null;
  }, []);

  /**
   * 全ゾーンの取得
   */
  const getAllZones = useCallback((): Map<string, FieldZone> => {
    return systemRef.current?.getAllZones() || new Map();
  }, []);

  /**
   * 落下判定閾値の更新
   */
  const updateLandingThreshold = useCallback((updates: {
    velocityY?: number;
    groundLevel?: number;
    minHeight?: number;
    maxTrackingTime?: number;
  }) => {
    systemRef.current?.updateLandingThreshold(updates);
  }, []);

  /**
   * 統計情報の取得
   */
  const getStatistics = useCallback(() => {
    return systemRef.current?.getStatistics() || {
      totalTrackedBalls: 0,
      landedBalls: 0,
      activeBalls: 0,
      totalZones: 0,
      landingThreshold: {}
    };
  }, []);

  /**
   * システムリセット
   */
  const reset = useCallback(() => {
    systemRef.current?.reset();
  }, []);

  return {
    // 基本機能
    startTracking,
    stopTracking,
    getTrackingInfo,
    getAllZones,

    // 設定・統計
    updateLandingThreshold,
    getStatistics,
    reset,

    // 内部システム参照（高度な用途）
    system: systemRef.current
  };
};