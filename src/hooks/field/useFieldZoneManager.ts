'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { FieldZoneManager } from '@/services/field/FieldZoneManager';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { FieldZone } from '@/types/field/fieldZone';

/**
 * フィールドゾーン管理用カスタムフック
 * Reactコンポーネントから使いやすい形でFieldZoneManagerを提供
 */
export const useFieldZoneManager = () => {
  const managerRef = useRef<FieldZoneManager | null>(null);
  const [judgmentHistory, setJudgmentHistory] = useState<HitJudgmentResult[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);

  // マネージャーの初期化
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new FieldZoneManager();
      
      // イベントコールバックの設定
      managerRef.current.setEventCallbacks({
        onHitJudgment: (result: HitJudgmentResult) => {
          setJudgmentHistory(prev => [...prev.slice(-9), result]); // 最新10件を保持
        },
        onBallLanding: (ballId: string, position: Vector3, judgmentType: string) => {
          console.log(`🎯 Ball ${ballId} landed: ${judgmentType} at position`, position);
        }
      });
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.reset();
      }
    };
  }, []);

  // ボール追跡開始
  const startTracking = useCallback((
    ballId: string,
    position: Vector3,
    velocity: Vector3
  ) => {
    managerRef.current?.startBallTracking(ballId, position, velocity);
  }, []);

  // ボール位置更新と判定
  const updateBallPosition = useCallback((
    ballId: string,
    position: Vector3,
    velocity: Vector3,
    deltaTime: number
  ): HitJudgmentResult | null => {
    return managerRef.current?.updateBallAndCheck(ballId, position, velocity, deltaTime) || null;
  }, []);

  // 位置からゾーン取得
  const getZoneAtPosition = useCallback((position: Vector3): FieldZone | null => {
    return managerRef.current?.getZoneAtPosition(position) || null;
  }, []);

  // ボール追跡停止
  const stopTracking = useCallback((ballId: string): boolean => {
    return managerRef.current?.stopBallTracking(ballId) || false;
  }, []);

  // ボール削除
  const removeBall = useCallback((ballId: string): boolean => {
    return managerRef.current?.removeBall(ballId) || false;
  }, []);

  // プレイヤー座標更新
  const updatePlayerPosition = useCallback((position: Vector3) => {
    managerRef.current?.updatePlayerPosition(position);
  }, []);

  // デバッグモード切り替え
  const toggleDebugMode = useCallback(() => {
    const newMode = !isDebugMode;
    setIsDebugMode(newMode);
    managerRef.current?.setDebugMode(newMode);
  }, [isDebugMode]);

  // 判定履歴のクリア
  const clearJudgmentHistory = useCallback(() => {
    setJudgmentHistory([]);
  }, []);

  // カスタムゾーンの追加
  const addCustomZone = useCallback((zone: FieldZone) => {
    managerRef.current?.addCustomZone(zone);
  }, []);

  // ゾーン削除
  const removeZone = useCallback((zoneId: string): boolean => {
    return managerRef.current?.removeZone(zoneId) || false;
  }, []);

  // 全ゾーン取得
  const getAllZones = useCallback((): Map<string, FieldZone> => {
    return managerRef.current?.getAllZones() || new Map();
  }, []);

  // パフォーマンス統計取得
  const getPerformanceStats = useCallback(() => {
    return managerRef.current?.getPerformanceStats();
  }, []);

  // デバッグ情報取得
  const getDebugInfo = useCallback(() => {
    return managerRef.current?.getDebugInfo();
  }, []);

  return {
    // 基本機能
    startTracking,
    updateBallPosition,
    getZoneAtPosition,
    stopTracking,
    removeBall,
    updatePlayerPosition,

    // ゾーン管理
    addCustomZone,
    removeZone,
    getAllZones,

    // デバッグ・統計
    isDebugMode,
    toggleDebugMode,
    judgmentHistory,
    clearJudgmentHistory,
    getPerformanceStats,
    getDebugInfo,

    // 内部参照（高度な用途）
    manager: managerRef.current
  };
};