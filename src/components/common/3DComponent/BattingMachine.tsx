'use client';

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { Ball } from './Ball';
import { useBattingMachine } from '@/hooks/game/useBattingMachine';
import { useCollisionManager, BatHitbox } from '@/hooks/game/useCollisionManager';

export interface BattingMachineProps {
  position?: Vector3;
  rotation?: Euler;
  launchInterval?: number;
  ballSpeed?: number;
  launchAngle?: number;
  autoStart?: boolean;
  debugMode?: boolean;
  batHitbox?: BatHitbox;
}

export const BattingMachine: React.FC<BattingMachineProps> = ({
  position = new Vector3(0, 2, -5),
  rotation = new Euler(0, 0, 0),
  launchInterval = 2.0,
  ballSpeed = 15,
  launchAngle = -10,
  autoStart = true,
  debugMode = false,
  batHitbox
}) => {
  const { balls, controls } = useBattingMachine({
    position,
    rotation,
    launchInterval,
    ballSpeed,
    launchAngle,
    autoStart
  });

  const { checkBallBatCollision } = useCollisionManager();

  useFrame((state) => {
    const launcher = controls.getLauncher();
    if (launcher) {
      launcher.update(state.clock.elapsedTime * 1000);
    }
  });

  // ボールの当たり判定をチェックする関数
  const handleBallHit = (ballId: string, position: Vector3, velocity: Vector3): Vector3 | null => {
    if (!batHitbox) return null;

    const tempBallProps = {
      id: ballId,
      initialPosition: position,
      velocity: velocity,
      onRemove: () => {}
    };

    const collision = checkBallBatCollision(tempBallProps, batHitbox);
    
    if (collision.hit && collision.newVelocity) {
      console.log(`Ball ${ballId} hit the bat!`);
      return collision.newVelocity;
    }
    
    return null;
  };

  return (
    <>
      {/* バッティングマシーン本体の表示 */}
      <group position={position} rotation={rotation}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        {/* 発射口 */}
        <mesh position={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>

      {/* バットのヒットボックスをデバッグ表示 */}
      {debugMode && batHitbox && (
        <mesh position={batHitbox.center}>
          <boxGeometry args={[batHitbox.size.x, batHitbox.size.y, batHitbox.size.z]} />
          <meshBasicMaterial color="red" opacity={0.3} transparent />
        </mesh>
      )}

      {/* ボールをレンダリング（当たり判定付き） */}
      {Array.from(balls.values()).map(ballProps => (
        <Ball 
          key={ballProps.id} 
          {...ballProps} 
          onHit={handleBallHit}
        />
      ))}
    </>
  );
};

export const BattingMachineDebugControls: React.FC<{
  controls: {
    start: () => void;
    stop: () => void;
    getBallCount: () => number;
  };
}> = ({ controls }) => (
  <div className="fixed top-4 left-4 z-50 bg-gray-800 text-white p-3 rounded text-xs">
    <div className="mb-2 font-bold">バッティングマシーン</div>
    <div className="mb-1">アクティブボール数: {controls.getBallCount()}</div>
    <div className="flex gap-2 mt-2">
      <button 
        onClick={controls.start}
        className="px-2 py-1 bg-green-600 rounded text-xs"
      >
        開始
      </button>
      <button 
        onClick={controls.stop}
        className="px-2 py-1 bg-red-600 rounded text-xs"
      >
        停止
      </button>
    </div>
  </div>
);
