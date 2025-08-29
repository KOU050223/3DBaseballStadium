'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Vector3, Euler } from 'three';
import { XRBall, XRBallProps } from './XRBall';

export interface XRBattingMachineProps {
  position?: Vector3;
  rotation?: Euler;
  launchInterval?: number;
  ballSpeed?: number;
  launchAngle?: number;
  autoStart?: boolean;
  gravityScale?: number;
  debugMode?: boolean;
  getBatVelocity?: () => Vector3;
}

type XRBallState = Omit<XRBallProps, 'onRemove'>;

export const XRBattingMachine: React.FC<XRBattingMachineProps> = ({
  position = new Vector3(0, 2, -5),
  rotation = new Euler(0, Math.PI, 0),
  launchInterval = 3.0,
  ballSpeed = 60,
  launchAngle = 0,
  autoStart = true,
  gravityScale = 1.5,
  debugMode = false,
  getBatVelocity,
}) => {
  const [balls, setBalls] = useState<XRBallState[]>([]);

  useEffect(() => {
    if (!autoStart) return;

    const launchBall = () => {
      const newBallId = `xr_ball_${Date.now()}`;
      const finalAngle = launchAngle;
      const angleInRadians = (finalAngle * Math.PI) / 180;
      const initialVelocity = new Vector3(
        0,
        ballSpeed * Math.sin(angleInRadians),
        ballSpeed * Math.cos(angleInRadians) 
      );
      
      initialVelocity.applyEuler(rotation);

      const newBall: XRBallState = {
        id: newBallId,
        initialPosition: position.clone(),
        initialVelocity: initialVelocity,
        gravityScale: gravityScale,
      };

      setBalls(prevBalls => [...prevBalls, newBall]);
    };

    const intervalId = setInterval(launchBall, launchInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoStart, launchInterval, ballSpeed, launchAngle, position, rotation, gravityScale, debugMode, getBatVelocity]);

  const handleRemoveBall = useCallback((id: string) => {
    setBalls(prevBalls => prevBalls.filter(ball => ball.id !== id));
  }, []);

  return (
    <>
      <group position={position} rotation={rotation}>
        <mesh>
          <boxGeometry args={[0.6, 0.4, 1.0]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>
        
        <mesh position={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
        </mesh>
        
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.7} />
        </mesh>
        
        <mesh position={[0, 0.25, 0.3]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial 
            color={autoStart ? "#00ff00" : "#ff0000"} 
            emissive={autoStart ? "#004400" : "#440000"}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {balls.map(ballProps => (
        <XRBall 
          key={ballProps.id} 
          {...ballProps} 
          onRemove={handleRemoveBall}
          getBatVelocity={getBatVelocity}
        />
      ))}
    </>
  );
};
