'use client';

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Ball } from './Ball';
import { useBattingMachine } from '@/hooks/game/useBattingMachine';

export interface BattingMachineProps {
  position?: Vector3;
  launchInterval?: number;
  ballSpeed?: number;
  launchAngle?: number;
  autoStart?: boolean;
  debugMode?: boolean;
}

export const BattingMachine: React.FC<BattingMachineProps> = ({
  position = new Vector3(0, 2, -5),
  launchInterval = 2.0,
  ballSpeed = 15,
  launchAngle = -10,
  autoStart = true,
  debugMode = false
}) => {
  const { balls, controls } = useBattingMachine({
    position,
    launchInterval,
    ballSpeed,
    launchAngle,
    autoStart
  });

  useFrame((state) => {
    const launcher = controls.getLauncher();
    if (launcher) {
      launcher.update(state.clock.elapsedTime * 1000);
    }
  });

  return (
    <>
      {/* バッティングマシーン本体の表示 */}
      <group position={position}>
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

      {/* ボールをレンダリング */}
      {Array.from(balls.values()).map(ballProps => (
        <Ball key={ballProps.id} {...ballProps} />
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
