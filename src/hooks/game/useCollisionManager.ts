import { useCallback } from 'react';
import { Vector3 } from 'three';
import { CollisionDetection } from '@/services/physics/CollisionDetection';
import { BallProps } from '@/types/game/ball';

export interface BatHitbox {
    center: Vector3;
    size: Vector3;
}

export const useCollisionManager = () => {
    const checkBallBatCollision = useCallback((
        ballProps: BallProps,
        batHitbox: BatHitbox
    ): { hit: boolean; newVelocity?: Vector3 } => {
        const ballPosition = ballProps.initialPosition;
        const ballRadius = ballProps.radius || 0.05;

        const collision = CollisionDetection.sphereBoxCollision(
            ballPosition,
            ballRadius,
            batHitbox.center,
            batHitbox.size
        );

        if (collision.hit && collision.hitPoint) {
            const normal = CollisionDetection.getBatNormal(collision.hitPoint, batHitbox.center);
            const newVelocity = CollisionDetection.calculateReflection(
                ballProps.velocity,
                normal,
                1.2
            );

            return { hit: true, newVelocity };
        }

        return { hit: false };
    }, []);

    return { checkBallBatCollision };
};
