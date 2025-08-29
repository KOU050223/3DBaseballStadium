'use client';

import { useRef, useState } from 'react';
import { RigidBody, CuboidCollider, CollisionEnterPayload, CollisionExitPayload } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FieldZone as FieldZoneType } from '@/types/field/fieldZone';
import { useRapierFieldZoneManager } from '@/hooks/field/useRapierFieldZoneManager';

interface RapierFieldZoneProps {
  zone: FieldZoneType;
  visible?: boolean;
  opacity?: number;
  wireframe?: boolean;
  onBallEnter?: (zone: FieldZoneType, ballId: string) => void;
  animated?: boolean;
}

/**
 * Rapier物理エンジンベースのフィールドゾーンコンポーネント
 * ColliderとRigidBodyを使用した物理的な判定エリア
 */
export const RapierFieldZone = ({
  zone,
  visible = true,
  opacity = 0.2,
  wireframe = false,
  onBallEnter,
  animated = false
}: RapierFieldZoneProps) => {
  const meshRef = useRef(null);
  const [ballsInZone, setBallsInZone] = useState<Set<string>>(new Set());

  // バウンディングボックスから位置とサイズを計算
  const { min, max } = zone.boundingBox;
  const position = [
    (min.x + max.x) / 2,
    (min.y + max.y) / 2,
    (min.z + max.z) / 2
  ] as [number, number, number];
  
  const size = [
    max.x - min.x,
    max.y - min.y,
    max.z - min.z
  ] as [number, number, number];

  // アニメーション効果
  useFrame((state) => {
    if (!meshRef.current || !animated) return;
    
    const time = state.clock.getElapsedTime();
    // 軽微な浮遊アニメーション
    const mesh = meshRef.current as THREE.Mesh;
    mesh.position.y = position[1] + Math.sin(time * 0.8 + zone.priority) * 0.2;
    
    // ボールがゾーンに入っている場合の強調効果
    const scale = ballsInZone.size > 0 ? 1.1 : 1.0;
    mesh.scale.setScalar(scale);
  });

  // ボールがゾーンに侵入した時の処理
  const handleCollisionEnter = (payload: CollisionEnterPayload) => {
    const otherBody = payload.other.rigidBodyObject;
    
    if (otherBody?.name === 'ball') {
      const ballId = otherBody.userData?.id || 'unknown';
      console.log(`⚾ Ball ${ballId} entered zone ${zone.id} (${zone.judgmentType})`);
      
      setBallsInZone(prev => new Set(prev).add(ballId));
      onBallEnter?.(zone, ballId);
    }
  };

  // ボールがゾーンから出た時の処理
  const handleCollisionExit = (payload: CollisionExitPayload) => {
    const otherBody = payload.other.rigidBodyObject;
    
    if (otherBody?.name === 'ball') {
      const ballId = otherBody.userData?.id || 'unknown';
      setBallsInZone(prev => {
        const newSet = new Set(prev);
        newSet.delete(ballId);
        return newSet;
      });
    }
  };

  // 判定タイプに基づいた色の決定
  const getZoneColor = () => {
    const hasActiveBalls = ballsInZone.size > 0;
    
    switch (zone.judgmentType) {
      case 'single': return hasActiveBalls ? '#22c55e' : '#16a34a';
      case 'double': return hasActiveBalls ? '#60a5fa' : '#3b82f6';
      case 'triple': return hasActiveBalls ? '#fbbf24' : '#f59e0b';
      case 'homerun': return hasActiveBalls ? '#f87171' : '#ef4444';
      case 'foul': return hasActiveBalls ? '#a3a3a3' : '#6b7280';
      case 'out': return hasActiveBalls ? '#f87171' : '#dc2626';
      default: return hasActiveBalls ? '#f3f4f6' : '#e5e7eb';
    }
  };

  if (!visible) return null;

  return (
    <RigidBody
      type="fixed"
      position={position}
      sensor={true} // センサーモード（物理的衝突なし、検出のみ）
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
      name={`field-zone-${zone.id}`}
    >
      <CuboidCollider args={[size[0]/2, size[1]/2, size[2]/2]} sensor />
      
      <mesh ref={meshRef} userData={{ zone, ballCount: ballsInZone.size }}>
        <boxGeometry args={size} />
        <meshLambertMaterial
          color={getZoneColor()}
          transparent
          opacity={ballsInZone.size > 0 ? opacity * 2 : opacity}
          wireframe={wireframe}
        />
      </mesh>
      
      {/* ゾーン情報表示（デバッグ用）*/}
      {ballsInZone.size > 0 && (
        <mesh position={[0, size[1] / 2 + 1, 0]}>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </RigidBody>
  );
};

/**
 * 全フィールドゾーンをRapierで描画するコンポーネント
 */
export const RapierStadiumFieldVisualizer = ({
  visible = true,
  showDebugInfo = false,
  animated = false
}: {
  visible?: boolean;
  showDebugInfo?: boolean;
  animated?: boolean;
}) => {
  const { getAllZones } = useRapierFieldZoneManager();
  const [activeBalls, setActiveBalls] = useState<Map<string, string>>(new Map());

  const handleBallEnterZone = (zone: FieldZoneType, ballId: string) => {
    setActiveBalls(prev => new Map(prev).set(ballId, zone.id));
  };

  if (!visible) return null;

  const zones = Array.from(getAllZones().values());

  return (
    <group name="rapier-stadium-field-visualizer">
      {zones.map((zone) => (
        <RapierFieldZone
          key={zone.id}
          zone={zone}
          visible={visible}
          animated={animated}
          onBallEnter={handleBallEnterZone}
        />
      ))}
      
      {/* デバッグ情報 */}
      {showDebugInfo && activeBalls.size > 0 && (
        <group name="debug-info">
          {/* デバッグ表示内容（必要に応じて実装） */}
        </group>
      )}
    </group>
  );
};