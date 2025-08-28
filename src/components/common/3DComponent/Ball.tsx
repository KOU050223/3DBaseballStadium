'use client';

import React, { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { RigidBody, BallCollider, RapierRigidBody, CollisionEnterPayload } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';

export interface BallProps {
  id: string;
  initialPosition: Vector3;
  initialVelocity: Vector3;
  onRemove: (id: string) => void;
  radius?: number;
  gravityScale?: number;
}

// Preload the model so it's ready
useGLTF.preload('/models/BaseballBall.glb');

export const Ball: React.FC<BallProps> = ({
  id,
  initialPosition,
  initialVelocity,
  onRemove,
  radius = 0.5, // Realistic baseball radius
  gravityScale = 1.5,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { nodes } = useGLTF('/models/BaseballBall.glb');
  const ballMesh = nodes.BaseballBall;

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
      <BallCollider args={[radius]} />
      {ballMesh && (
        <primitive 
          object={ballMesh.clone()} 
          scale={radius / 2} // Adjust scale to match collider
        />
      )}
    </RigidBody>
  );
};