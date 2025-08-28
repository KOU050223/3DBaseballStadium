'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { Bat, BatProps } from './Bat';
import { BatHitbox } from '@/hooks/game/useCollisionManager';

// BatControllerが受け取るPropsの型を定義
interface BatControllerProps extends Omit<BatProps, 'rotation'> {
  startRotation: Euler;
  endRotation: Euler;
  onHitboxUpdate?: (hitbox: BatHitbox) => void;
}

export interface BatControllerRef {
  getBatHitbox: () => BatHitbox;
  isSwinging: () => boolean;
}

export const BatController = forwardRef<BatControllerRef, BatControllerProps>((props, ref) => {
  const { startRotation, endRotation, position = new Vector3(0, 0, 0), scale = 1, onHitboxUpdate } = props;
  const [rotation, setRotation] = useState(startRotation);
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingProgress, setSwingProgress] = useState(0);

  const swingSpeed = 0.1;

  // バットのヒットボックスを計算
  const calculateBatHitbox = useCallback((): BatHitbox => {
    let batSize: Vector3;
    const batCenter = position.clone();
    
    if (isSwinging) {
      // スイング中は横向きの当たり判定（幅を大きく、高さを小さく）
      batSize = new Vector3(1.5 * scale, 0.2 * scale, 0.5 * scale);
      batCenter.add(new Vector3(0.3 * swingProgress, 0, 0.2 * swingProgress));
    } else {
      // 通常時は縦向きの当たり判定
      batSize = new Vector3(0.1 * scale, 1.2 * scale, 0.1 * scale);
    }

    return { center: batCenter, size: batSize };
  }, [position, scale, isSwinging, swingProgress]);

  // refで外部からアクセス可能なメソッドを定義
  useImperativeHandle(ref, () => ({
    getBatHitbox: calculateBatHitbox,
    isSwinging: () => isSwinging
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

  // ヒットボックスの更新を親に通知
  useEffect(() => {
    if (onHitboxUpdate) {
      const hitbox = calculateBatHitbox();
      onHitboxUpdate(hitbox);
    }
  }, [isSwinging, swingProgress, position, scale, onHitboxUpdate, calculateBatHitbox]);

  useFrame(() => {
    if (isSwinging) {
      let newProgress = swingProgress + swingSpeed;
      if (newProgress >= 1) {
        newProgress = 1;
        setIsSwinging(false);
      }
      setSwingProgress(newProgress);

      const interpolatedRotation = new Euler(
        startRotation.x + (endRotation.x - startRotation.x) * newProgress,
        startRotation.y + (endRotation.y - startRotation.y) * newProgress,
        startRotation.z + (endRotation.z - startRotation.z) * newProgress
      );
      setRotation(interpolatedRotation);

      if (newProgress >= 1) {
        setTimeout(() => {
          setRotation(startRotation);
          setSwingProgress(0);
        }, 150);
      }
    }
  });

  return <Bat {...props} rotation={rotation} />;
});

BatController.displayName = 'BatController';
