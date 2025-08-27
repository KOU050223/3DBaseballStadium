'use client';

import { useRef, useEffect, useState } from 'react';
import { Vector3, Euler } from 'three';
import { BallLauncher, LauncherConfig, IBallSpawner } from '@/services/baseball/BallLauncher';
import { BallPhysics } from '@/services/physics/BallPhysics';
import { BallProps } from '@/types/game/ball';

export interface BattingMachineConfig {
    position?: Vector3;
    rotation?: Euler;
    launchInterval?: number;
    ballSpeed?: number;
    launchAngle?: number;
    autoStart?: boolean;
}

// IBallSpawnerの実装
class BattingMachineSpawner implements IBallSpawner {
    constructor(
        private setBalls: React.Dispatch<React.SetStateAction<Map<string, BallProps>>>,
        private rotation: Euler
    ) { }

    spawnBall(id: string, position: Vector3, velocity: Vector3): void {
        // 回転を考慮した速度ベクトルを計算
        const rotatedVelocity = velocity.clone();
        rotatedVelocity.applyEuler(this.rotation);

        const ballProps: BallProps = {
            id,
            initialPosition: position.clone(),
            velocity: rotatedVelocity,
            onRemove: (ballId: string) => {
                this.setBalls(prev => {
                    const newBalls = new Map(prev);
                    newBalls.delete(ballId);
                    return newBalls;
                });
            }
        };

        this.setBalls(prev => {
            const newBalls = new Map(prev);
            newBalls.set(id, ballProps);
            return newBalls;
        });
    }
}

export const useBattingMachine = ({
    position = new Vector3(0, 2, -5),
    rotation = new Euler(0, 0, 0),
    launchInterval = 2.0,
    ballSpeed = 15,
    launchAngle = -10,
    autoStart = true
}: BattingMachineConfig) => {
    const [balls, setBalls] = useState<Map<string, BallProps>>(new Map());
    const launcherRef = useRef<BallLauncher | null>(null);

    useEffect(() => {
        const spawner = new BattingMachineSpawner(setBalls, rotation);

        const launcherConfig: LauncherConfig = {
            position: position.clone(),
            interval: launchInterval,
            isActive: autoStart
        };

        const ballPhysics = new BallPhysics({
            speed: ballSpeed,
            angle: launchAngle,
            gravity: 9.8
        });

        launcherRef.current = new BallLauncher(launcherConfig, ballPhysics, spawner);

        return () => {
            launcherRef.current = null;
        };
    }, [position, rotation, launchInterval, ballSpeed, launchAngle, autoStart]);

    const controls = {
        start: () => launcherRef.current?.start(),
        stop: () => launcherRef.current?.stop(),
        getBallCount: () => balls.size,
        getLauncher: () => launcherRef.current
    };

    return { balls, controls };
};
