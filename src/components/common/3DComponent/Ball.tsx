'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { RigidBody, BallCollider, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier';
import { useGLBLoader } from '@/hooks/useGLBLoader';
import { useRapierFieldZoneManager } from '@/hooks/field/useRapierFieldZoneManager';
import { HitJudgmentResult } from '@/types/field/hitJudgment';

export interface BallProps {
  id: string;
  initialPosition: Vector3;
  initialVelocity: Vector3;
  onRemove: (id: string) => void;
  radius?: number;
  gravityScale?: number;
  onJudgment?: (result: HitJudgmentResult) => void;
  enableFieldZoneTracking?: boolean;
}

export const Ball = ({
  id,
  initialPosition,
  initialVelocity,
  onRemove,
  radius = 5.0, // Realistic baseball radius
  gravityScale = 1.5,
  onJudgment,
  enableFieldZoneTracking = true
}: BallProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const glbScene = useGLBLoader({ modelPath: '/models/BaseballBall.glb' });
  const hasBeenHitRef = useRef<boolean>(false);
  const isTrackingRef = useRef<boolean>(false);
  
  // Rapierベースのフィールドゾーン管理システム
  const { 
    startTracking, 
    stopTracking
  } = useRapierFieldZoneManager();

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
      // クリーンアップ時にトラッキングを停止
      if (enableFieldZoneTracking && isTrackingRef.current) {
        stopTracking(id);
      }
      if (batCollisionCooldownTimer.current) {
        clearTimeout(batCollisionCooldownTimer.current);
      }
    };
  }, [id, initialVelocity, onRemove, enableFieldZoneTracking, stopTracking]);

  const [isBatCollisionCooldown, setIsBatCollisionCooldown] = useState(false);
  const batCollisionCooldownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCollision = (payload: CollisionEnterPayload) => {
    const collidedObjectName = payload.other.rigidBodyObject?.name;

    if (collidedObjectName === 'bat') {
      console.log('Ball hit the bat!');
      
      if (isBatCollisionCooldown) {
        console.log('Ignoring bat collision due to cooldown.');
        return; // Ignore collision if in cooldown
      }
      
      hasBeenHitRef.current = true;

      // Apply velocity change
      if (!rigidBodyRef.current) return;
      
      const currentVelocity = rigidBodyRef.current.linvel();
      const newVelocity = new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z);

      // Reverse Y-component and apply multiplier for bat collision
      const velocityMultiplier = 7.0;
      newVelocity.y = Math.abs(currentVelocity.y) * velocityMultiplier;
      newVelocity.x *= velocityMultiplier;
      newVelocity.z *= velocityMultiplier;
      rigidBodyRef.current.setLinvel(newVelocity, true);

      // Apply gravity increase
      const gravityIncrease = 1.5;
      rigidBodyRef.current.setGravityScale(rigidBodyRef.current.gravityScale() + gravityIncrease, true);

      // Start cooldown for bat collision
      setIsBatCollisionCooldown(true);
      if (batCollisionCooldownTimer.current) {
        clearTimeout(batCollisionCooldownTimer.current);
      }
      batCollisionCooldownTimer.current = setTimeout(() => {
        setIsBatCollisionCooldown(false);
        batCollisionCooldownTimer.current = null;
      }, 100);

      // Rapierベースのフィールドゾーン追跡を開始
      if (enableFieldZoneTracking && !isTrackingRef.current) {
        startTracking(id, rigidBodyRef.current, (result) => {
          onJudgment?.(result);
          // 判定完了後はボールを削除
          setTimeout(() => {
            onRemove(id);
          }, 1500);
        });
        isTrackingRef.current = true;
      }
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      colliders={false} // Use a custom collider
      restitution={0.7} // Bounciness
      name="ball"
      onCollisionEnter={handleCollision}
      gravityScale={gravityScale}
    >
      <BallCollider args={[radius * 0.1]} />
      {glbScene ? (
        <primitive 
          object={glbScene.clone()} // glbSceneを直接レンダリング
          scale={radius} // Adjust scale to match collider
        />
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
      )}
    </RigidBody>
  );
};