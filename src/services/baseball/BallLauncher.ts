import { Vector3 } from 'three';
import { BallPhysics, BallPhysicsConfig } from '@/services/physics/BallPhysics';

export interface LauncherConfig {
    position: Vector3;
    interval: number;
    isActive: boolean;
}

export interface IBallSpawner {
    spawnBall(id: string, position: Vector3, velocity: Vector3): void;
}

//ボールの発射タイミングと設定のみを管理
export class BallLauncher {
    private launcherConfig: LauncherConfig;
    private ballPhysics: BallPhysics;
    private spawner: IBallSpawner;
    private lastLaunchTime: number = 0;
    private ballCounter: number = 0;

    constructor(
        launcherConfig: LauncherConfig,
        ballPhysics: BallPhysics,
        spawner: IBallSpawner
    ) {
        this.launcherConfig = launcherConfig;
        this.ballPhysics = ballPhysics;
        this.spawner = spawner;
    }

    update(currentTime: number): void {
        if (!this.launcherConfig.isActive) return;

        if (currentTime - this.lastLaunchTime >= this.launcherConfig.interval * 1000) {
            this.launchBall();
            this.lastLaunchTime = currentTime;
        }
    }

    private launchBall(): void {
        const ballId = `ball_${this.ballCounter++}`;
        const velocity = this.ballPhysics.calculateInitialVelocity();

        this.spawner.spawnBall(ballId, this.launcherConfig.position, velocity);
    }

    updateLauncherConfig(config: Partial<LauncherConfig>): void {
        this.launcherConfig = { ...this.launcherConfig, ...config };
    }

    updateBallPhysics(config: Partial<BallPhysicsConfig>): void {
        this.ballPhysics.updateConfig(config);
    }

    start(): void {
        this.launcherConfig.isActive = true;
    }

    stop(): void {
        this.launcherConfig.isActive = false;
    }

    getLauncherConfig(): LauncherConfig {
        return { ...this.launcherConfig };
    }
}
