'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler, Quaternion } from 'three';
import { RigidBody, MeshCollider, RapierRigidBody } from '@react-three/rapier';
import { Bat, BatProps } from './Bat';

// BatControllerが受け取るPropsの型を定義
interface BatControllerProps extends Omit<BatProps, 'rotation'> {
  startRotation: Euler;
  endRotation: Euler;
}

export interface BatControllerRef {
  isSwinging: () => boolean;
  triggerSwing: () => void;
}

export const BatController = forwardRef<BatControllerRef, BatControllerProps>((props, ref) => {
  const { startRotation, endRotation, position = new Vector3(0, 0, 0), scale } = props;
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingProgress, setSwingProgress] = useState(0);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  const swingSpeed = 0.08;

  // refで外部からアクセス可能なメソッドを定義
  useImperativeHandle(ref, () => ({
    isSwinging: () => isSwinging,
    triggerSwing,
  }));

  const triggerSwing = useCallback(() => {
    if (!isSwinging) {
      setSwingProgress(0);
      setIsSwinging(true);
    }
  }, [isSwinging]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        triggerSwing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerSwing]);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    // 毎フレーム、親から渡された位置情報を物理ボディに適用
    rigidBodyRef.current.setNextKinematicTranslation(position);

    const startQuat = new Quaternion().setFromEuler(startRotation);
    const endQuat = new Quaternion().setFromEuler(endRotation);

    if (isSwinging) {
      let newProgress = swingProgress + swingSpeed;
      if (newProgress >= 1) {
        newProgress = 1;
        setIsSwinging(false);
      }
      setSwingProgress(newProgress);

      const interpolatedQuaternion = new Quaternion().copy(startQuat).slerp(endQuat, newProgress);
      rigidBodyRef.current.setNextKinematicRotation(interpolatedQuaternion);

      if (newProgress >= 1) {
        setTimeout(() => {
          if (rigidBodyRef.current) {
            rigidBodyRef.current.setNextKinematicRotation(startQuat);
          }
          setSwingProgress(0);
        }, 150);
      }
    } else {
        // スイング中でないときは、常に開始時の角度に設定
        rigidBodyRef.current.setNextKinematicRotation(startQuat);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false} // カスタムのColliderを使うため、デフォルトは無効化
      name="bat" // デバッグや衝突イベントで識別しやすくするために名前をつける
    >
      <MeshCollider type="hull">
        <Bat 
          {...props} 
          rotation={new Euler(0, 0, 0)} // 回転はRigidBodyで制御するのでリセット
          position={new Vector3(0, 1.3, 0)}
        scale={scale} // scaleを明示的に渡す
        />
      </MeshCollider>
    </RigidBody>
  );
});

BatController.displayName = 'BatController';
