
'use client';

import React, { useRef } from 'react';
import { Mesh, Vector3, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

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
      velocityRef.current.copy(newVelocity);  
      
      // ヒット時は色を変更
      const material = meshRef.current.material as MeshStandardMaterial;
      if (material) {
        material.color.setHex(0xff0000);
      }
      
      // 当たった後は当たり判定を無効化
      onHit = undefined;
    }
  }

  
  if (onHit) {  
    velocityRef.current.y -= 9.8 * delta;
  }

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
