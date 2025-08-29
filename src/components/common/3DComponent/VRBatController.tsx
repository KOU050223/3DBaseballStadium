'use client';

import React, { useState, forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Euler, Quaternion } from 'three';
import { RigidBody, MeshCollider, RapierRigidBody } from '@react-three/rapier';
import { useXR, useXRInputSourceState, useXRInputSourceEvent } from '@react-three/xr';
import { Bat, BatProps } from '@/components/common/3DComponent/Bat';

interface VRBatControllerProps extends Omit<BatProps, 'rotation'> {
  startRotation: Euler;
  endRotation: Euler;
  enableVR?: boolean;
}

export interface VRBatControllerRef {
  isSwinging: () => boolean;
}

export const VRBatController = forwardRef<VRBatControllerRef, VRBatControllerProps>((props, ref) => {
  const { 
    startRotation, 
    endRotation, 
    position = new Vector3(0, 0, 0), 
    scale: batVisualScale = 1,
    enableVR = true 
  } = props;
  
  const [isSwinging, setIsSwinging] = useState(false);
  const [swingProgress, setSwingProgress] = useState(0);
  const [vrMode, setVrMode] = useState(false);
  
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const batPositionRef = useRef<Vector3>(position.clone());
  const batRotationRef = useRef<Quaternion>(new Quaternion().setFromEuler(startRotation));
  
  const swingSpeed = 0.1;
  
  // XRの状態を取得
  const xrState = useXR();
  const isPresenting = !!xrState.session;
  
  const rightControllerState = useXRInputSourceState('controller', 'right');
  
  useImperativeHandle(ref, () => ({
    isSwinging: () => isSwinging
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
      console.log('Swing triggered!');
      
      // VRモードでの振動フィードバック
      if (vrMode && rightControllerState?.inputSource?.gamepad?.hapticActuators?.[0]) {
        try {
          rightControllerState.inputSource.gamepad.hapticActuators[0].pulse(0.5, 200);
          console.log('Haptic feedback sent');
        } catch (error) {
          console.log('Haptic feedback failed:', error);
        }
      }
    }
  }, [isSwinging, vrMode, rightControllerState]);

  // VRコントローラーのイベントリスナー設定（最新API）
  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'select',
    () => {
      console.log('Controller select event');
      triggerSwing();
    },
    [triggerSwing]
  );

  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'squeeze',
    () => {
      console.log('Controller squeeze event');
      triggerSwing();
    },
    [triggerSwing]
  );

  useEffect(() => {
    if (!vrMode) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          console.log('Space key pressed');
          triggerSwing();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [triggerSwing, vrMode]);

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
        
        // バットをコントローラーの位置
        const batOffset = new Vector3(0, -0.1, -0.3);
        batOffset.applyQuaternion(controllerQuaternion);
        const batPosition = controllerPosition.clone().add(batOffset);
        
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
          const combinedQuat = controllerQuaternion.clone().multiply(swingQuat);
          batRotationRef.current.copy(combinedQuat);
          rigidBodyRef.current.setNextKinematicRotation(combinedQuat);
          
          if (newProgress >= 1) {
            setTimeout(() => {
              if (rigidBodyRef.current && vrMode) {
                batRotationRef.current.copy(controllerQuaternion);
                rigidBodyRef.current.setNextKinematicRotation(controllerQuaternion);
              }
              setSwingProgress(0);
            }, 150);
          }
        } else {
          // スイング中でないときはコントローラーの回転をそのまま使用
          batRotationRef.current.copy(controllerQuaternion);
          rigidBodyRef.current.setNextKinematicRotation(controllerQuaternion);
        }
      } catch (error) {
        console.error('VR controller tracking error:', error);
        // フォールバック処理
        rigidBodyRef.current.setNextKinematicTranslation(position);
        rigidBodyRef.current.setNextKinematicRotation(startQuat);
      }
    } else {
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
      name="bat"
    >
      <MeshCollider type="hull">
        <Bat 
          {...props} 
          rotation={new Euler(0, 0, 0)}
          position={vrMode ? new Vector3(0, 0, 0) : new Vector3(0, 1.3, 0)}
          scale={batVisualScale}
        />
        
        {/* VRモード時のデバッグ表示 */}
        {vrMode && rightControllerState && (
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.05, 0.03, 0.1]} />
            <meshStandardMaterial color="#00ff00" transparent opacity={0.7} />
          </mesh>
        )}
      </MeshCollider>
    </RigidBody>
  );
});

VRBatController.displayName = 'VRBatController';
