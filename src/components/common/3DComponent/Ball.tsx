'use client';

import React, { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { RigidBody, BallCollider, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier';
import { useGLBLoader } from '@/hooks/useGLBLoader'; // useGLBLoaderをインポート

export interface BallProps {
  id: string;
  initialPosition: Vector3;
  initialVelocity: Vector3;
  onRemove: (id: string) => void;
  radius?: number;
  gravityScale?: number;
}

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  initialVelocity,
  onRemove,
  radius = 10.0, // Realistic baseball radius
  gravityScale = 1.5,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const glbScene = useGLBLoader({ modelPath: '/models/BaseballBall.glb' }); // useGLBLoaderを使ってモデルをロード

  useEffect(() => {
    // Apply initial impulse when the component mounts
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyImpulse(initialVelocity, true);
    }

    // Set a timeout to remove the ball after some time to prevent clutter
    const timer = setTimeout(() => {
      onRemove(id);
    }, 10000); // Remove after 10 seconds

    return () => clearTimeout(timer);
  }, [id, initialVelocity, onRemove]);

  const handleCollision = (payload: CollisionEnterPayload) => {
    // Check if the ball collided with the bat
    if (payload.other.rigidBodyObject?.name === 'bat') {
      console.log('Ball hit the bat!');
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