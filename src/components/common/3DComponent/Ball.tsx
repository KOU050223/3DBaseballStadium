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

  const hasCollidedWithTarget = useRef(false); // Add this line

  const handleCollision = (payload: CollisionEnterPayload) => {
    const collidedObjectName = payload.other.rigidBodyObject?.name;

    if (collidedObjectName === 'bat') {
      console.log('Ball hit the bat!');
    }

    if (!hasCollidedWithTarget.current && (collidedObjectName === 'bat' || collidedObjectName === 'stadium')) {
      console.log(`Ball hit the ${collidedObjectName}! Applying physics changes.`);
      if (rigidBodyRef.current) {
        let velocityMultiplier = 7.0;
        let gravityIncrease = 1.5;

        if (collidedObjectName === 'stadium') {
          // Adjust these values as desired for stadium collision
          velocityMultiplier = 1; // Example: 1 times velocity
          gravityIncrease = 1; // Example: 1 increase in gravity
        }

        // Apply velocity change
        const currentVelocity = rigidBodyRef.current.linvel();
        const newVelocity = new Vector3(currentVelocity.x, currentVelocity.y, currentVelocity.z).multiplyScalar(velocityMultiplier);
        rigidBodyRef.current.setLinvel(newVelocity, true);

        // Apply gravity change
        rigidBodyRef.current.setGravityScale(rigidBodyRef.current.gravityScale() + gravityIncrease, true);

        hasCollidedWithTarget.current = true; // Set flag to true after first collision
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