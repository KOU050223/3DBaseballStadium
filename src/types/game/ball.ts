import { Vector3 } from 'three';

export interface BallProps {
    id: string;
    initialPosition: Vector3;
    velocity: Vector3;
    onRemove: (id: string) => void;
    color?: string;
    radius?: number;
    onHit?: (ballId: string, position: Vector3, velocity: Vector3) => Vector3 | null;
}
