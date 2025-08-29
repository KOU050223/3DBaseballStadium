'use client';

import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { FieldZone as FieldZoneType } from '@/types/field/fieldZone';

interface FieldZoneProps {
  zone: FieldZoneType;
  visible?: boolean;
  opacity?: number;
  wireframe?: boolean;
  onHover?: (zone: FieldZoneType | null) => void;
  onClick?: (zone: FieldZoneType) => void;
  animated?: boolean;
}

/**
 * 3D空間上のフィールドゾーンを可視化するコンポーネント
 * 判定エリアを視覚的に表現し、インタラクティブな操作を提供
 */
export const FieldZone = ({
  zone,
  visible = true,
  opacity = 0.3,
  wireframe = false,
  onHover,
  onClick,
  animated = false
}: FieldZoneProps) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

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
    
    // 軽微な浮遊アニメーション
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5) * 0.1;
    
    // ホバー時の拡大効果
    const scale = hovered ? 1.05 : 1.0;
    meshRef.current.scale.setScalar(scale);
  });

  const handlePointerEnter = () => {
    setHovered(true);
    onHover?.(zone);
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHover?.(null);
  };

  const handleClick = () => {
    onClick?.(zone);
  };

  // 判定タイプに基づいた色の決定
  const getZoneColor = () => {
    if (hovered) {
      // ホバー時は明るくする
      switch (zone.judgmentType) {
        case 'single': return '#34d399';
        case 'double': return '#60a5fa';
        case 'triple': return '#fbbf24';
        case 'homerun': return '#f87171';
        case 'foul': return '#9ca3af';
        case 'out': return '#ef4444';
        default: return '#e5e7eb';
      }
    }
    return zone.color || '#e5e7eb';
  };

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      userData={{ zone }}
    >
      <boxGeometry args={size} />
      <meshLambertMaterial
        color={getZoneColor()}
        transparent
        opacity={hovered ? opacity * 1.5 : opacity}
        wireframe={wireframe}
      />
      
      {/* ゾーンラベル表示（オプション）*/}
      {zone.label && (
        <group position={[0, size[1] / 2 + 0.5, 0]}>
          {/* 3Dテキストは重いので、条件付きで表示 */}
          {hovered && (
            <mesh>
              <planeGeometry args={[4, 1]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      )}
    </mesh>
  );
};

/**
 * デバッグ用の詳細情報表示コンポーネント
 */
export const FieldZoneDebugInfo = ({ zone }: { zone: FieldZoneType }) => {
  return (
    <div className="bg-black/75 text-white p-2 rounded text-xs">
      <div><strong>ID:</strong> {zone.id}</div>
      <div><strong>Type:</strong> {zone.judgmentType}</div>
      <div><strong>Priority:</strong> {zone.priority}</div>
      {zone.label && <div><strong>Label:</strong> {zone.label}</div>}
      <div><strong>Bounds:</strong></div>
      <div className="ml-2">
        Min: ({zone.boundingBox.min.x.toFixed(1)}, {zone.boundingBox.min.y.toFixed(1)}, {zone.boundingBox.min.z.toFixed(1)})
      </div>
      <div className="ml-2">
        Max: ({zone.boundingBox.max.x.toFixed(1)}, {zone.boundingBox.max.y.toFixed(1)}, {zone.boundingBox.max.z.toFixed(1)})
      </div>
    </div>
  );
};