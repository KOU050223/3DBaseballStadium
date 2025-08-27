import { Vector3 } from 'three';

//ボールの物理計算のみを担当
export interface BallPhysicsConfig {
    speed: number;
    angle: number;
    gravity: number;
}

export class BallPhysics {
    private config: BallPhysicsConfig;

    constructor(config: BallPhysicsConfig) {
        this.config = config;
    }

    calculateInitialVelocity(): Vector3 {
        const angleRad = (this.config.angle * Math.PI) / 180;

        return new Vector3(
            0, // X方向の速度（左右）
            Math.sin(angleRad) * this.config.speed, // Y方向の速度（上下）
            Math.cos(angleRad) * this.config.speed  // Z方向の速度（前後）
        );
    }

    // 重力加速度を適用した速度ベクトルを計算
    applyGravity(velocity: Vector3, deltaTime: number): Vector3 {
        return new Vector3(
            velocity.x,
            velocity.y - this.config.gravity * deltaTime,
            velocity.z
        );
    }

    updateConfig(newConfig: Partial<BallPhysicsConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    getConfig(): BallPhysicsConfig {
        return { ...this.config };
    }
}
