'use client';

import React, { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { BallProps } from '@/types/game/ball';

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  velocity,
  onRemove,
  color = '#ffffff',
  radius = 0.037
}) => {
  const meshRef = useRef<Mesh>(null);
  const positionRef = useRef<Vector3>(initialPosition.clone());

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 位置を更新
    positionRef.current.add(velocity.clone().multiplyScalar(delta));
    meshRef.current.position.copy(positionRef.current);

    // ボールが一定範囲を超えたら削除
    if (positionRef.current.z > 10 || 
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
