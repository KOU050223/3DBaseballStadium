'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { RigidBody, BallCollider, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier';
import { useGLBLoader } from '@/hooks/useGLBLoader';
import { useFrame } from '@react-three/fiber';

export interface XRBallProps {
  id: string;
  initialPosition: Vector3;
  initialVelocity: Vector3;
  onRemove: (id: string) => void;
  radius?: number;
  gravityScale?: number;
  getBatVelocity?: () => Vector3;
}

export const XRBall = ({
  id,
  initialPosition,
  initialVelocity,
  onRemove,
  radius = 5.0,
  gravityScale = 1.5,
  getBatVelocity,
}: XRBallProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const glbScene = useGLBLoader({ modelPath: '/models/BaseballBall.glb' });
  const hasCollidedWithTarget = useRef(false);
  const [isBatCollisionCooldown, setIsBatCollisionCooldown] = useState(false);
  const batCollisionCooldownTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyImpulse(initialVelocity, true);
    }

    const timer = setTimeout(() => {
      onRemove(id);
    }, 10000);

    return () => {
      clearTimeout(timer);
      if (batCollisionCooldownTimer.current) {
        clearTimeout(batCollisionCooldownTimer.current);
      }
    };
  }, [id, initialVelocity, onRemove]);

  const calculateBallTrajectory = (ballVelocity: Vector3, batVelocity: Vector3, impactPoint: Vector3): Vector3 => {
    const batSpeed = batVelocity.length();
    const ballSpeed = ballVelocity.length();
    const baseDirection = new Vector3(0, 0.3, -1).normalize();
    const batDirection = batVelocity.normalize();
    const resultDirection = baseDirection.clone().add(batDirection.multiplyScalar(0.4)).normalize();
    const transferEfficiency = 0.8;
    const resultSpeed = Math.min((batSpeed * transferEfficiency + ballSpeed * 0.3) * 8.0, 100);
    return resultDirection.multiplyScalar(resultSpeed);
  };

  const handleCollision = (payload: CollisionEnterPayload) => {
    const collidedObjectName = payload.other.rigidBodyObject?.name;
    
    if (collidedObjectName === 'bat') {
      if (isBatCollisionCooldown || hasCollidedWithTarget.current) {
        return;
      }
      
      if (rigidBodyRef.current) {
        const currentVelocity = rigidBodyRef.current.linvel();
        const ballVelocity = new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z);
        
        const actualBatVelocity = getBatVelocity ? getBatVelocity() : new Vector3(
          Math.random() * 10 - 5,
          Math.random() * 5 + 2,
          -15 - Math.random() * 10
        );
        
        const ballPosition = rigidBodyRef.current.translation();
        const impactPoint = new Vector3(ballPosition.x, ballPosition.y, ballPosition.z);
        const newVelocity = calculateBallTrajectory(ballVelocity, actualBatVelocity, impactPoint);
        
        rigidBodyRef.current.setLinvel(newVelocity, true);
        rigidBodyRef.current.setGravityScale(0.8, true);
        
        setIsBatCollisionCooldown(true);
        hasCollidedWithTarget.current = true;
        
        if (batCollisionCooldownTimer.current) {
          clearTimeout(batCollisionCooldownTimer.current);
        }
        batCollisionCooldownTimer.current = setTimeout(() => {
          setIsBatCollisionCooldown(false);
          batCollisionCooldownTimer.current = null;
        }, 200);
      }
    } else if (collidedObjectName === 'stadium' && !hasCollidedWithTarget.current) {
      if (rigidBodyRef.current) {
        const currentVelocity = rigidBodyRef.current.linvel();
        const newVelocity = new Vector3(
          currentVelocity.x * 0.6,
          Math.abs(currentVelocity.y) * 0.4,
          currentVelocity.z * 0.6
        );
        
        rigidBodyRef.current.setLinvel(newVelocity, true);
        rigidBodyRef.current.setGravityScale(2.0, true);
        hasCollidedWithTarget.current = true;
      }
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      colliders={false}
      restitution={0.7}
      name="xr-ball"
      onCollisionEnter={handleCollision}
      gravityScale={gravityScale}
    >
      <BallCollider args={[radius * 0.1]} />
      {glbScene ? (
        <primitive 
          object={glbScene.clone()}
          scale={radius}
        />
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color="#FF4444" />
        </mesh>
      )}
    </RigidBody>
  );
};
