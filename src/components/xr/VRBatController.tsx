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
  const swingSpeed = 0.12;
  
  const xrState = useXR();
  const isPresenting = !!xrState.session;
  const rightControllerState = useXRInputSourceState('controller', 'right');
  
  useImperativeHandle(ref, () => ({
    isSwinging: () => isSwinging,
    getBatVelocity: () => currentVelocity.current.clone()
  }));

  useEffect(() => {
    const isVRActive = isPresenting && enableVR;
    setVrMode(isVRActive);
  }, [isPresenting, enableVR, rightControllerState]);

  const triggerSwing = useCallback(() => {
    if (!isSwinging) {
      setSwingProgress(0);
      setIsSwinging(true);
      
      if (vrMode && rightControllerState?.inputSource?.gamepad?.hapticActuators?.[0]) {
        try {
          rightControllerState.inputSource.gamepad.hapticActuators[0].pulse(0.7, 300);
        } catch (error) {
          console.log('Haptic feedback failed:', error);
        }
      }
    }
  }, [isSwinging, vrMode, rightControllerState]);

  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'select',
    triggerSwing,
    [triggerSwing]
  );

  useXRInputSourceEvent(
    rightControllerState?.inputSource || undefined,
    'squeeze',
    triggerSwing,
    [triggerSwing]
  );

  useEffect(() => {
    if (!vrMode) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          triggerSwing();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [triggerSwing, vrMode]);

  const updateVelocity = useCallback((newPosition: Vector3) => {
    const deltaTime = 1/60;
    const velocity = newPosition.clone().sub(previousPosition.current).divideScalar(deltaTime);
    currentVelocity.current.copy(velocity);
    previousPosition.current.copy(newPosition);
    
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
        const controllerPosition = new Vector3();
        const controllerQuaternion = new Quaternion();
        
        controller.getWorldPosition(controllerPosition);
        controller.getWorldQuaternion(controllerQuaternion);
        
        const batOffset = new Vector3(0, -0.2, -0.4); 
        batOffset.applyQuaternion(controllerQuaternion);
        const batPosition = controllerPosition.clone().add(batOffset);
        
        updateVelocity(batPosition);
        batPositionRef.current.copy(batPosition);
        rigidBodyRef.current.setNextKinematicTranslation(batPosition);
        
        if (isSwinging) {
          let newProgress = swingProgress + swingSpeed;
          if (newProgress >= 1) {
            newProgress = 1;
            setIsSwinging(false);
          }
          setSwingProgress(newProgress);
          
          const swingQuat = new Quaternion().copy(startQuat).slerp(endQuat, newProgress);
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
          const batOrientationOffset = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
          const adjustedQuat = controllerQuaternion.clone().multiply(batOrientationOffset);
          batRotationRef.current.copy(adjustedQuat);
          rigidBodyRef.current.setNextKinematicRotation(adjustedQuat);
        }
      } catch (error) {
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
      {vrMode ? (
        <group>
          <CuboidCollider args={[0.04, 0.4, 0.04]} position={[0, 0, 0]} />
          <Bat 
            {...props} 
            rotation={new Euler(0, 0, 0)}
            position={new Vector3(0, 0, 0)}
            scale={batVisualScale}
          />
        </group>
      ) : (
        <MeshCollider type="trimesh">
          <Bat 
            {...props} 
            rotation={new Euler(0, 0, 0)}
            position={new Vector3(0, 1.3, 0)}
            scale={batVisualScale}
          />
        </MeshCollider>
      )}
    </RigidBody>
  );
});

VRBatController.displayName = 'VRBatController';
