'use client';

import React, { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { RigidBody, BallCollider, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier';
import { useGLBLoader } from '@/hooks/useGLBLoader';
import { useFrame } from '@react-three/fiber';
import { useFieldZoneManager } from '@/hooks/field/useFieldZoneManager';
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
  
  // フィールドゾーン管理システム
  const { 
    startTracking, 
    updateBallPosition, 
    stopTracking, 
    removeBall 
  } = useFieldZoneManager();

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
        removeBall(id);
      }
    };
  }, [id, initialVelocity, onRemove, enableFieldZoneTracking, stopTracking, removeBall]);

  // フィールドゾーン判定のためのフレーム更新
  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !enableFieldZoneTracking) return;

    const currentPosition = rigidBodyRef.current.translation();
    const currentVelocity = rigidBodyRef.current.linvel();
    
    const position = new Vector3(currentPosition.x, currentPosition.y, currentPosition.z);
    const velocity = new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z);

    // バットとの衝突後に追跡を開始
    if (hasBeenHitRef.current && !isTrackingRef.current) {
      startTracking(id, position, velocity);
      isTrackingRef.current = true;
    }

    // 追跡中の場合は判定を実行
    if (isTrackingRef.current) {
      const judgmentResult = updateBallPosition(id, position, velocity, delta);

      // 判定が発生した場合の処理
      if (judgmentResult) {
        onJudgment?.(judgmentResult);
        
        // 判定完了後はボールを削除
        setTimeout(() => {
          onRemove(id);
        }, 1000); // 1秒後に削除（判定結果表示のため）
      }
    }
  });

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