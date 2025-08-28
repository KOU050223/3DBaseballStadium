'use client';

import React, { useRef, useEffect } from 'react';
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

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  initialVelocity,
  onRemove,
  radius = 10.0, // Realistic baseball radius
  gravityScale = 1.5,
  onJudgment,
  enableFieldZoneTracking = true
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const glbScene = useGLBLoader({ modelPath: '/models/BaseballBall.glb' });
  const hasBeenHitRef = useRef<boolean>(false);
  const isTrackingRef = useRef<boolean>(false);
  
  // Rapierベースのフィールドゾーン管理システム
  const { 
    startTracking, 
    stopTracking,
    getTrackingInfo
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
    };
  }, [id, initialVelocity, onRemove, enableFieldZoneTracking, stopTracking]);

  const handleCollision = (payload: CollisionEnterPayload) => {
    // Check if the ball collided with the bat
    if (payload.other.rigidBodyObject?.name === 'bat') {
      console.log('Ball hit the bat!');
      hasBeenHitRef.current = true;
      
      // バット接触時の処理（必要に応じて速度調整等）
      if (rigidBodyRef.current) {
        // より強い打撃力を適用（例）
        const hitVelocity = new Vector3(
          (Math.random() - 0.5) * 40, // -20 to 20
          Math.random() * 30 + 10,    // 10 to 40
          Math.random() * 60 + 20     // 20 to 80
        );
        rigidBodyRef.current.setLinvel(hitVelocity, true);

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
      <BallCollider args={[radius * 0.05]} />
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