'use client';
import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Vector3, Euler } from 'three';
import { Ball, BallProps } from './Ball';

export interface BattingMachineRef {
  launchBall: () => void;
}

export interface BattingMachineProps {
  position?: Vector3;
  rotation?: Euler;
  ballSpeed?: number;
  launchAngle?: number;
  gravityScale?: number;
  debugMode?: boolean;
}

// Use a type that omits onRemove as it's handled internally
type BallState = Omit<BallProps, 'onRemove'>;

export const BattingMachine = forwardRef<BattingMachineRef, BattingMachineProps>(({
  position = new Vector3(0, 2, 13),
  rotation = new Euler(0, Math.PI, 0),
  ballSpeed = 0.01,
  launchAngle = 0,
  gravityScale = 1.5,
}, ref) => {
  const [balls, setBalls] = useState<BallState[]>([]);

  const launchBall = useCallback(() => {
    const newBallId = `ball_${Date.now()}`;
    
    // Calculate initial velocity based on speed and angle
    const angleInRadians = (launchAngle * Math.PI) / 180;
    const initialVelocity = new Vector3(
      0,
      ballSpeed * Math.sin(angleInRadians),
      ballSpeed * Math.cos(angleInRadians)
    );
    // Apply the machine's rotation to the velocity
    initialVelocity.applyEuler(rotation);

    const newBall: BallState = {
      id: newBallId,
      initialPosition: position.clone(),
      initialVelocity: initialVelocity,
      gravityScale: gravityScale,
    };

    setBalls(prevBalls => [...prevBalls, newBall]);
  }, [ballSpeed, launchAngle, position, rotation, gravityScale]);

  useImperativeHandle(ref, () => ({
    launchBall,
  }));

  const handleRemoveBall = useCallback((id: string) => {
    setBalls(prevBalls => prevBalls.filter(ball => ball.id !== id));
  }, []);

  return (
    <>
      {/* Batting machine model */}
      <group position={position} rotation={rotation}>
        <mesh>
          <boxGeometry args={[0.5, 0.3, 0.8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>

      {/* Render the balls */}
      {balls.map(ballProps => (
        <Ball 
          key={ballProps.id} 
          {...ballProps} 
          onRemove={handleRemoveBall}
        />
      ))}
    </>
  );
});