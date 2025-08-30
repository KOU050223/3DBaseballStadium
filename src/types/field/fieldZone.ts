import { Vector3 } from 'three';
import { PlayResult } from '@/types/game/gameState';

// バウンディングボックス定義
export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

// フィールドゾーンの定義
export interface FieldZone {
  id: string;                    // ゾーンの一意識別子
  judgmentType: PlayResult;      // 判定結果（props対応）
  boundingBox: BoundingBox;      // 3D空間での境界
  priority: number;              // 重複時の優先度（高い方が優先）
  label?: string;                // デバッグ用ラベル
  color?: string;                // 可視化用カラー
  description?: string;          // ゾーンの説明
}

// フィールドゾーンコンポーネント用Props
export interface FieldZoneProps {
  zone: FieldZone;
  visible: boolean;              // デバッグモードでの表示制御
  onBallLanding?: (judgmentType: PlayResult, position: Vector3, zoneId: string) => void;
}

// 空間グリッド用の型定義
export interface SpatialGrid {
  gridSize: number;
  cells: Map<string, string[]>; // "x,z" -> zoneIds[]
}

// フィールドマップ設定
export interface FieldMapConfig {
  gridSize: number;             // 空間分割のグリッドサイズ
  fieldBounds: BoundingBox;     // フィールド全体の境界
}