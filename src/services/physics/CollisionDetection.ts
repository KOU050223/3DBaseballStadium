import { Vector3, Box3, Sphere } from 'three';

export interface CollisionResult {
    hit: boolean;
    hitPoint?: Vector3;
    reflectedVelocity?: Vector3;
}

export class CollisionDetection {
    // 球と箱の当たり判定
    static sphereBoxCollision(
        sphereCenter: Vector3,
        sphereRadius: number,
        boxCenter: Vector3,
        boxSize: Vector3
    ): CollisionResult {
        const box = new Box3(
            new Vector3(
                boxCenter.x - boxSize.x / 2,
                boxCenter.y - boxSize.y / 2,
                boxCenter.z - boxSize.z / 2
            ),
            new Vector3(
                boxCenter.x + boxSize.x / 2,
                boxCenter.y + boxSize.y / 2,
                boxCenter.z + boxSize.z / 2
            )
        );

        const sphere = new Sphere(sphereCenter, sphereRadius);
        const hit = box.intersectsSphere(sphere);

        if (hit) {
            const closestPoint = box.clampPoint(sphereCenter, new Vector3());
            return { hit: true, hitPoint: closestPoint };
        }

        return { hit: false };
    }

    // 反射ベクトルを計算
    static calculateReflection(
        velocity: Vector3,
        normal: Vector3,
        restitution: number = 0.8
    ): Vector3 {
        // 発射方向とは逆向きに飛ばす
        const reflection = new Vector3(
            Math.random() * 10 - 5,
            Math.abs(velocity.y) + 10,
            Math.abs(velocity.z) * 1.5
        );

        return reflection;
    }

    // バット表面の法線ベクトルを計算
    static getBatNormal(hitPoint: Vector3, batCenter: Vector3): Vector3 {
        return hitPoint.clone().sub(batCenter).normalize();
    }
}
