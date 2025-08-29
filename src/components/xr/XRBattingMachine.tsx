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
  position = new Vector3(0, 2, 13),
  rotation = new Euler(0, Math.PI, 0),
  launchInterval = 3.0,
  ballSpeed = 0.01,
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
    
      //ランダム変動を小さくする場合
      // const angleVariation = (Math.random() - 0.5) * 5; 
      // const speedVariation = ballSpeed + (Math.random() - 0.5) * ballSpeed * 0.2; 
      const finalAngle = launchAngle;
      
      const angleInRadians = (finalAngle * Math.PI) / 180;
      const initialVelocity = new Vector3(
        0, // (Math.random() - 0.5) * speedVariation * 0.1, 
        ballSpeed * Math.sin(angleInRadians),
        ballSpeed * Math.cos(angleInRadians) 
      );
      
      // Apply the machine's rotation to the velocity
      initialVelocity.applyEuler(rotation);

      const newBall: XRBallState = {
        id: newBallId,
        initialPosition: position.clone(), 
        // initialPosition: position.clone().add(new Vector3(
        //   (Math.random() - 0.5) * 0.2, 
        //   0,
        //   0
        // )),
        initialVelocity: initialVelocity,
        gravityScale: gravityScale,
      };

      setBalls(prevBalls => [...prevBalls, newBall]);
      
      if (debugMode) {
        console.log('XR Ball launched:', {
          id: newBallId,
          velocity: initialVelocity,
          angle: finalAngle,
          speed: ballSpeed 
        });
      }
    };

    const intervalId = setInterval(launchBall, launchInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoStart, launchInterval, ballSpeed, launchAngle, position, rotation, gravityScale, debugMode, getBatVelocity]);

  const handleRemoveBall = useCallback((id: string) => {
    setBalls(prevBalls => {
      const filtered = prevBalls.filter(ball => ball.id !== id);
      if (debugMode && filtered.length !== prevBalls.length) {
        console.log('XR Ball removed:', id);
      }
      return filtered;
    });
  }, [debugMode]);

  return (
    <>
      {/* Enhanced batting machine model for XR */}
      <group position={position} rotation={rotation}>
        {/* Main body */}
        <mesh>
          <boxGeometry args={[0.6, 0.4, 1.0]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Pitching tube */}
        <mesh position={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Base */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.7} />
        </mesh>
        
        {/* Status indicator (active/inactive) */}
        <mesh position={[0, 0.25, 0.3]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial 
            color={autoStart ? "#00ff00" : "#ff0000"} 
            emissive={autoStart ? "#004400" : "#440000"}
            emissiveIntensity={0.5}
          />
        </mesh>
        
        {debugMode && (
          // Debug info display
          <mesh position={[0, 0.6, 0]}>
            <planeGeometry args={[1, 0.3]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
        )}
      </group>

      {/* Render the XR balls */}
      {balls.map(ballProps => (
        <XRBall 
          key={ballProps.id} 
          {...ballProps} 
          onRemove={handleRemoveBall}
          getBatVelocity={getBatVelocity}
        />
      ))}
      
      {/* Debug information */}
      {debugMode && (
        <mesh position={[position.x, position.y + 1, position.z]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} />
        </mesh>
      )}
    </>
  );
};
