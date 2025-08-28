
'use client';

import React, { useRef, useEffect } from 'react';
import { Mesh, Vector3, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useFieldZoneManager } from '@/hooks/field/useFieldZoneManager';
import { HitJudgmentResult } from '@/types/field/hitJudgment';

export interface BallProps {
  id: string;
  initialPosition: Vector3;
  velocity: Vector3;
  onRemove: (id: string) => void;
  color?: string;
  radius?: number;
  gravity?: number;
  onHit?: (ballId: string, position: Vector3, velocity: Vector3) => Vector3 | null;
  onJudgment?: (result: HitJudgmentResult) => void;
  enableFieldZoneTracking?: boolean;
}

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  velocity,
  onRemove,
  onHit,
  onJudgment,
  color = '#ffffff',
  radius = 0.3,
  gravity = 9.8,
  enableFieldZoneTracking = true
}) => {
  const meshRef = useRef<Mesh>(null);
  const positionRef = useRef<Vector3>(initialPosition.clone());
  const velocityRef = useRef<Vector3>(velocity.clone());
  const hasBeenHitRef = useRef<boolean>(false);
  const isTrackingRef = useRef<boolean>(false);
  
  // フィールドゾーン管理システム
  const { 
    startTracking, 
    updateBallPosition, 
    stopTracking, 
    removeBall 
  } = useFieldZoneManager();

  // ボール追跡の開始
  useEffect(() => {
    if (enableFieldZoneTracking && !isTrackingRef.current) {
      startTracking(id, positionRef.current, velocityRef.current);
      isTrackingRef.current = true;
    }

    return () => {
      if (enableFieldZoneTracking && isTrackingRef.current) {
        stopTracking(id);
        removeBall(id);
        isTrackingRef.current = false;
      }
    };
  }, [id, enableFieldZoneTracking, startTracking, stopTracking, removeBall]);

useFrame((state, delta) => {
  if (!meshRef.current) return;

  // バット当たり判定チェック
  if (onHit && !hasBeenHitRef.current) {
    const newVelocity = onHit(id, positionRef.current, velocityRef.current);
    if (newVelocity) {
      velocityRef.current.copy(newVelocity);
      hasBeenHitRef.current = true;
      
      // ヒット時は色を変更
      const material = meshRef.current.material as MeshStandardMaterial;
      if (material) {
        material.color.setHex(0xff0000);
      }
      
      // フィールドゾーン追跡を開始（バット接触後）
      if (enableFieldZoneTracking && !isTrackingRef.current) {
        startTracking(id, positionRef.current, velocityRef.current);
        isTrackingRef.current = true;
      }
    }
  }

  // 重力適用（常に）
  velocityRef.current.y -= gravity * delta;

  // 位置更新
  positionRef.current.add(velocityRef.current.clone().multiplyScalar(delta));
  meshRef.current.position.copy(positionRef.current);

  // フィールドゾーン判定（追跡中の場合）
  if (enableFieldZoneTracking && isTrackingRef.current) {
    const judgmentResult = updateBallPosition(
      id,
      positionRef.current,
      velocityRef.current,
      delta
    );

    // 判定が発生した場合の処理
    if (judgmentResult) {
      onJudgment?.(judgmentResult);
      
      // 判定完了後はボールを削除
      setTimeout(() => {
        onRemove(id);
      }, 1000); // 1秒後に削除（判定結果表示のため）
      
      return; // フレーム処理を終了
    }
  }

  // ボールが一定範囲を超えたら削除
  if (positionRef.current.z < -30 || 
      positionRef.current.y < -10 || 
      Math.abs(positionRef.current.x) > 50) {
    if (isTrackingRef.current) {
      stopTracking(id);
      removeBall(id);
    }
    onRemove(id);
  }
});

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};
