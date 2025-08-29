'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler, Quaternion } from 'three';
import { RigidBody, MeshCollider, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { useXR, useXRInputSourceState, useXRInputSourceEvent } from '@react-three/xr';
import { Bat, BatProps } from '@/components/common/3DComponent/Bat';

interface VRBatControllerProps extends Omit<BatProps, 'rotation'> {
  startRotation: Euler;
  endRotation: Euler;
  enableVR?: boolean;
  onVelocityUpdate?: (velocity: Vector3) => void;
}

export interface VRBatControllerRef {
  isSwinging: () => boolean;
  getBatVelocity: () => Vector3;
}

export const VRBatController = forwardRef<VRBatControllerRef, VRBatControllerProps>((props, ref) => {
  const { 
    startRotation, 
    endRotation, 
    position = new Vector3(0, 0, 0), 
    scale: batVisualScale = 1,
    enableVR = true,
    onVelocityUpdate
  } = props;
  
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingProgress, setSwingProgress] = useState(0);
  const [vrMode, setVrMode] = useState(false);
  
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const batPositionRef = useRef<Vector3>(position.clone());
  const batRotationRef = useRef<Quaternion>(new Quaternion().setFromEuler(startRotation));
  
  // Velocity tracking
  const previousPosition = useRef<Vector3>(position.clone());
  const currentVelocity = useRef<Vector3>(new Vector3(0, 0, 0));
  const velocityHistory = useRef<Vector3[]>([]);
  
  const swingSpeed = 0.12; // Slightly faster for VR
  
  // XRの状態を取得
  const xrState = useXR();
  const isPresenting = !!xrState.session;
  
  const rightControllerState = useXRInputSourceState('controller', 'right');
  
  useImperativeHandle(ref, () => ({
    isSwinging: () => isSwinging,
    getBatVelocity: () => currentVelocity.current.clone()
  }));

  // VRモードの状態を更新
  useEffect(() => {
    const isVRActive = isPresenting && enableVR;
    setVrMode(isVRActive);
    console.log('VR Mode:', isVRActive, 'isPresenting:', isPresenting, 'rightController:', !!rightControllerState);
  }, [isPresenting, enableVR, rightControllerState]);

  const triggerSwing = useCallback(() => {
    if (!isSwinging) {
      setSwingProgress(0);
      setIsSwinging(true);
      console.log(' swing triggered!');
      
      // VRモードでの振動フィードバック
      if (vrMode && rightControllerState?.inputSource?.gamepad?.hapticActuators?.[0]) {
        try {
          rightControllerState.inputSource.gamepad.hapticActuators[0].pulse(0.7, 300);
          console.log(' haptic feedback sent');
        } catch (error) {
          console.log('Haptic feedback failed:', error);
        }
      }
    }
  }, [isSwinging, vrMode, rightControllerState]);

  // VRコントローラーのイベントリスナー設定
  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'select',
    () => {
      console.log('controller select event');
      triggerSwing();
    },
    [triggerSwing]
  );

  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'squeeze',
    () => {
      console.log(' controller squeeze event');
      triggerSwing();
    },
    [triggerSwing]
  );

  useEffect(() => {
    if (!vrMode) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          console.log(' space key pressed');
          triggerSwing();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [triggerSwing, vrMode]);

  // Calculate velocity
  const updateVelocity = useCallback((newPosition: Vector3) => {
    const deltaTime = 1/60; // Assuming 60fps
    const velocity = newPosition.clone().sub(previousPosition.current).divideScalar(deltaTime);
    
    // Store velocity in history for smoothing
    velocityHistory.current.push(velocity);
    if (velocityHistory.current.length > 5) {
      velocityHistory.current.shift();
    }
    
    // Calculate average velocity for smoothing
    const avgVelocity = velocityHistory.current.reduce((sum, v) => sum.add(v), new Vector3()).divideScalar(velocityHistory.current.length);
    currentVelocity.current.copy(avgVelocity);
    
    previousPosition.current.copy(newPosition);
    
    // Callback for external components
    if (onVelocityUpdate) {
      onVelocityUpdate(currentVelocity.current);
    }
  }, [onVelocityUpdate]);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const startQuat = new Quaternion().setFromEuler(startRotation);
    const endQuat = new Quaternion().setFromEuler(endRotation);

    if (vrMode && rightControllerState?.object) {
      try {
        const controller = rightControllerState.object;
        
        // コントローラーのワールド位置・回転を取得
        const controllerPosition = new Vector3();
        const controllerQuaternion = new Quaternion();
        
        controller.getWorldPosition(controllerPosition);
        controller.getWorldQuaternion(controllerQuaternion);
        
        // バットをコントローラーの位置に配置（調整されたオフセット）
        const batOffset = new Vector3(0, -0.2, -0.4); 
        batOffset.applyQuaternion(controllerQuaternion);
        const batPosition = controllerPosition.clone().add(batOffset);
        
        // Update velocity tracking
        updateVelocity(batPosition);
        
        batPositionRef.current.copy(batPosition);
        rigidBodyRef.current.setNextKinematicTranslation(batPosition);
        
        if (isSwinging) {
          // スイング中は回転アニメーション
          let newProgress = swingProgress + swingSpeed;
          if (newProgress >= 1) {
            newProgress = 1;
            setIsSwinging(false);
          }
          setSwingProgress(newProgress);
          
          const swingQuat = new Quaternion().copy(startQuat).slerp(endQuat, newProgress);
          // バットの向きを調整するための回転オフセット
          const batOrientationOffset = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
          const combinedQuat = controllerQuaternion.clone().multiply(batOrientationOffset).multiply(swingQuat);
          batRotationRef.current.copy(combinedQuat);
          rigidBodyRef.current.setNextKinematicRotation(combinedQuat);
          
          if (newProgress >= 1) {
            setTimeout(() => {
              if (rigidBodyRef.current && vrMode) {
                const resetQuat = controllerQuaternion.clone().multiply(batOrientationOffset);
                batRotationRef.current.copy(resetQuat);
                rigidBodyRef.current.setNextKinematicRotation(resetQuat);
              }
              setSwingProgress(0);
            }, 150);
          }
        } else {
          // スイング中でないときはコントローラーの回転にオフセットを適用
          const batOrientationOffset = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
          const adjustedQuat = controllerQuaternion.clone().multiply(batOrientationOffset);
          batRotationRef.current.copy(adjustedQuat);
          rigidBodyRef.current.setNextKinematicRotation(adjustedQuat);
        }
      } catch (error) {
        console.error('Enhanced  VR controller tracking error:', error);
        // フォールバック処理
        rigidBodyRef.current.setNextKinematicTranslation(position);
        rigidBodyRef.current.setNextKinematicRotation(startQuat);
        updateVelocity(position);
      }
    } else {
      // Non-VR mode
      updateVelocity(position);
      rigidBodyRef.current.setNextKinematicTranslation(position);
      
      if (isSwinging) {
        let newProgress = swingProgress + swingSpeed;
        if (newProgress >= 1) {
          newProgress = 1;
          setIsSwinging(false);
        }
        setSwingProgress(newProgress);

        const interpolatedQuaternion = new Quaternion().copy(startQuat).slerp(endQuat, newProgress);
        batRotationRef.current.copy(interpolatedQuaternion);
        rigidBodyRef.current.setNextKinematicRotation(interpolatedQuaternion);

        if (newProgress >= 1) {
          setTimeout(() => {
            if (rigidBodyRef.current) {
              batRotationRef.current.copy(startQuat);
              rigidBodyRef.current.setNextKinematicRotation(startQuat);
            }
            setSwingProgress(0);
          }, 150);
        }
      } else {
        batRotationRef.current.copy(startQuat);
        rigidBodyRef.current.setNextKinematicRotation(startQuat);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      name="bat" // 名前を統一
    >
      {/* VRモードでは直接CuboidCollider、非VRモードではtrimeshコライダーを使用 */}
      {vrMode ? (
        // VRモード：CuboidColliderを直接使用
        <group>
          {/* バット全体をカバーするCuboidCollider */}
          <CuboidCollider args={[0.04, 0.4, 0.04]} position={[0, 0, 0]} />
          
          {/* ビジュアルのバット */}
          <Bat 
            {...props} 
            rotation={new Euler(0, 0, 0)}
            position={new Vector3(0, 0, 0)}
            scale={batVisualScale}
          />
          
          {/* デバッグ用のバット当たり判定可視化 */}
          <mesh position={[0, 0, 0]} visible={true}>
            <boxGeometry args={[0.08, 0.8, 0.08]} />
            <meshStandardMaterial color="#ff0000" wireframe transparent opacity={0.3} />
          </mesh>
        </group>
      ) : (
        // 非VRモード：従来のtrimeshコライダー
        <MeshCollider type="trimesh">
          <Bat 
            {...props} 
            rotation={new Euler(0, 0, 0)}
            position={new Vector3(0, 1.3, 0)}
            scale={batVisualScale}
          />
        </MeshCollider>
      )}
      
      {/* VRモード時のデバッグ表示 */}
      {vrMode && rightControllerState && (
        <>
          {/* Controller tracking indicator */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.05, 0.03, 0.1]} />
            <meshStandardMaterial color="#00ff00" transparent opacity={0.7} />
          </mesh>
          
          {/* Velocity indicator */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.02, 0.02, Math.min(currentVelocity.current.length() * 0.01, 0.3)]} />
            <meshStandardMaterial color="#ffff00" transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </RigidBody>
  );
});

VRBatController.displayName = 'VRBatController';
