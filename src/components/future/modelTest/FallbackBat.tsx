'use client';

import React from 'react';

interface FallbackBatProps {
  color?: string;
}

export const FallbackBat: React.FC<FallbackBatProps> = ({ color = "#8B4513" }) => {
  return (
    <group>
      {/* グリップエンド */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.05, 16]} />
        <meshStandardMaterial color="#2F1B14" />
      </mesh>
      
      {/* グリップ部分 */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.35, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      
      {/* テーパー部分 */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.025, 0.04, 0.15, 16]} />
        <meshStandardMaterial color="#A0522D" roughness={0.7} />
      </mesh>
      
      {/* バット本体 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 0.5, 16]} />
        <meshStandardMaterial color="#CD853F" roughness={0.8} />
      </mesh>
      
      {/* バット先端部 */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.15, 16]} />
        <meshStandardMaterial color="#DEB887" roughness={0.9} />
      </mesh>
      
      {/* バット最先端 */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#F5DEB3" roughness={0.9} />
      </mesh>
    </group>
  );
};