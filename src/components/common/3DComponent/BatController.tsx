'use client';

import { useState, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Vector3 } from 'three';
import { Bat, BatProps } from '@/components/common/3DComponent/Bat';

// BatControllerが受け取るPropsの型を定義
interface BatControllerProps extends Omit<BatProps, 'rotation'> { // rotationは内部で管理
  startRotation: Euler; // 開始角度
  endRotation: Euler;   // 終了角度
}

export const BatController = forwardRef<unknown, BatControllerProps>((props, ref) => {
  const { startRotation, endRotation } = props; // propsから取得
  const [rotation, setRotation] = useState(startRotation); // 初期状態は開始角度

  const [isSwinging, setIsSwinging] = useState(false);
  const [swingProgress, setSwingProgress] = useState(0);

  const swingSpeed = 0.1; // スイングの速さ

  const triggerSwing = () => {
    if (!isSwinging) {
      setSwingProgress(0);
      setIsSwinging(true);
    }
  };

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
  }, [isSwinging]);

  // useFrame内でアニメーションを更新
  useFrame(() => {
    if (isSwinging) {
      let newProgress = swingProgress + swingSpeed;
      if (newProgress >= 1) {
        newProgress = 1;
        setIsSwinging(false);
      }
      setSwingProgress(newProgress);

      // startRotationからendRotationへ線形補間
      const interpolatedRotation = new Euler(
        startRotation.x + (endRotation.x - startRotation.x) * newProgress,
        startRotation.y + (endRotation.y - startRotation.y) * newProgress,
        startRotation.z + (endRotation.z - startRotation.z) * newProgress
      );
      setRotation(interpolatedRotation);

      if (newProgress >= 1) {
        setTimeout(() => {
          setRotation(startRotation); // 開始角度に戻す
          setSwingProgress(0);
        }, 150);
      }
    }
  });

  return (
    <group 
      position={props.position ? [props.position.x, props.position.y, props.position.z] : [0, 0, 0]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <Bat 
        {...props} 
        rotation={new Euler(0, 0, 0)}
        position={new Vector3(0, 1.3, 0)}
      />
    </group>
  );
});

// displayNameを設定してデバッグしやすくする
BatController.displayName = 'BatController';