// src/components/common/3DComponent/Ball.tsx
'use client';

import React, { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// 拡張されたBallProps
export interface BallProps {
  id: string;
  initialPosition: Vector3;
  velocity: Vector3;
  onRemove: (id: string) => void;
  color?: string;
  radius?: number;
  onHit?: (ballId: string, position: Vector3, velocity: Vector3) => Vector3 | null;
}

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  velocity,
  onRemove,
  onHit,
  color = '#ffffff',
  radius = 0.3
}) => {
  const meshRef = useRef<Mesh>(null);
  const positionRef = useRef<Vector3>(initialPosition.clone());
  const velocityRef = useRef<Vector3>(velocity.clone());

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 当たり判定チェック
    if (onHit) {
      const newVelocity = onHit(id, positionRef.current, velocityRef.current);
      if (newVelocity) {
        velocityRef.current = newVelocity;
        // ヒット時は色を変更
        const material = meshRef.current.material as any;
        if (material) {
          material.color.setHex(0xff0000);
        }
      }
    }

    // 簡易的な重力適用
    velocityRef.current.y -= 9.8 * delta;

    // 位置を更新
    positionRef.current.add(velocityRef.current.clone().multiplyScalar(delta));
    meshRef.current.position.copy(positionRef.current);

    // ボールが一定範囲を超えたら削除
    if (positionRef.current.z < -30 || 
        positionRef.current.y < -5 || 
        Math.abs(positionRef.current.x) > 20) {
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
