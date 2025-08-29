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
  const lastBatVelocity = useRef<Vector3>(new Vector3(0, 0, 0));

  useEffect(() => {
    // Apply initial impulse when the component mounts
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyImpulse(initialVelocity, true);
    }

    // Set a timeout to remove the ball after some time to prevent clutter
    const timer = setTimeout(() => {
      onRemove(id);
    }, 10000); // Remove after 10 seconds

    return () => {
      clearTimeout(timer);
      if (batCollisionCooldownTimer.current) {
        clearTimeout(batCollisionCooldownTimer.current);
      }
    };
  }, [id, initialVelocity, onRemove]);

  // Track bat velocity for better collision physics
  useFrame(() => {
    // This would be populated by the bat controller in a real implementation
    // For now, we'll calculate it during collision
  });

  const calculateBallTrajectory = (ballVelocity: Vector3, batVelocity: Vector3, impactPoint: Vector3): Vector3 => {
    // More realistic ball physics calculation
    const batSpeed = batVelocity.length();
    const ballSpeed = ballVelocity.length();
    
    // Base direction: primarily forward (towards pitcher's mound)
    const baseDirection = new Vector3(0, 0.3, -1).normalize();
    
    // Add some variation based on bat velocity direction
    const batDirection = batVelocity.normalize();
    
    // Combine bat swing direction with base forward direction
    const resultDirection = baseDirection.clone()
      .add(batDirection.multiplyScalar(0.4))
      .normalize();
    
    // Calculate result speed based on bat speed and ball speed
    const transferEfficiency = 0.8; // How much of bat energy transfers to ball
    const resultSpeed = Math.min(
      (batSpeed * transferEfficiency + ballSpeed * 0.3) * 8.0, // Scale up for more distance
      100 // Maximum speed cap
    );
    
    return resultDirection.multiplyScalar(resultSpeed);
  };

  const handleCollision = (payload: CollisionEnterPayload) => {
    const collidedObjectName = payload.other.rigidBodyObject?.name;
    
    if (collidedObjectName === 'bat') {
      console.log('XR Ball hit the bat!');
      
      if (isBatCollisionCooldown || hasCollidedWithTarget.current) {
        console.log('Ignoring bat collision due to cooldown or previous collision.');
        return;
      }
      
      if (rigidBodyRef.current) {
        // Get current ball velocity
        const currentVelocity = rigidBodyRef.current.linvel();
        const ballVelocity = new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z);
        
        // Get bat velocity from the bat controller if available
        const actualBatVelocity = getBatVelocity ? getBatVelocity() : new Vector3(
          Math.random() * 10 - 5, // Some horizontal component
          Math.random() * 5 + 2,  // Upward component
          -15 - Math.random() * 10 // Strong forward component
        );
        
        // Calculate impact point
        const ballPosition = rigidBodyRef.current.translation();
        const impactPoint = new Vector3(ballPosition.x, ballPosition.y, ballPosition.z);
        
        // Calculate new trajectory
        const newVelocity = calculateBallTrajectory(ballVelocity, actualBatVelocity, impactPoint);
        
        console.log('XR Ball new velocity:', newVelocity);
        
        // Apply the new velocity
        rigidBodyRef.current.setLinvel(newVelocity, true);
        
        // Reduce gravity for a more arcade-like feel
        rigidBodyRef.current.setGravityScale(0.8, true);
        
        // Start cooldown
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
      console.log('XR Ball hit the stadium!');
      
      if (rigidBodyRef.current) {
        // Stadium collision - just add some bounce
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
