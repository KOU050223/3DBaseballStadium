import { Vector3 } from 'three';
import { FieldZone } from '@/types/field/fieldZone';

/**
 * 野球場フィールドゾーン定義
 * 座標系:
 * - ホームプレート: (0, 0, 0)
 * - 1塁方向: +X軸
 * - 3塁方向: -X軸  
 * - センター方向: +Z軸
 * - 高さ: +Y軸
 */

export const createFieldZoneMap = (): Map<string, FieldZone> => {
  const zones = new Map<string, FieldZone>();
  
  // === フェアテリトリー ===
  
  // 内野安打エリア（ホームプレート周辺）
  zones.set('infield-single', {
    id: 'infield-single',
    judgmentType: 'single',
    boundingBox: {
      min: new Vector3(-15, -1, 0),
      max: new Vector3(15, 5, 30)
    },
    priority: 1,
    label: '内野安打エリア',
    color: '#22c55e',
    description: 'ホームプレート周辺の単打エリア'
  });
  
  // 外野安打エリア（より深い位置）
  zones.set('outfield-single', {
    id: 'outfield-single',
    judgmentType: 'single',
    boundingBox: {
      min: new Vector3(-20, -1, 25),
      max: new Vector3(20, 8, 45)
    },
    priority: 2,
    label: '外野安打エリア',
    color: '#16a34a',
    description: '外野での単打エリア'
  });
  
  // 二塁打エリア
  zones.set('outfield-double', {
    id: 'outfield-double', 
    judgmentType: 'double',
    boundingBox: {
      min: new Vector3(-25, -1, 40),
      max: new Vector3(25, 10, 70)
    },
    priority: 3,
    label: '外野二塁打エリア',
    color: '#3b82f6',
    description: '二塁打が期待できる外野エリア'
  });
  
  // 三塁打エリア（深い外野）
  zones.set('deep-triple', {
    id: 'deep-triple',
    judgmentType: 'triple',
    boundingBox: {
      min: new Vector3(-35, -1, 65),
      max: new Vector3(35, 15, 95)
    },
    priority: 4,
    label: '深い外野三塁打エリア',
    color: '#f59e0b',
    description: '三塁打が期待できる深い外野エリア'
  });
  
  // ホームランエリア（スタンド手前）
  zones.set('homerun-zone', {
    id: 'homerun-zone',
    judgmentType: 'homerun',
    boundingBox: {
      min: new Vector3(-40, 8, 90),
      max: new Vector3(40, 50, 130)
    },
    priority: 5,
    label: 'ホームランエリア',
    color: '#ef4444',
    description: 'ホームラン確定エリア'
  });
  
  // === ファウルテリトリー ===
  
  // 左側ファウルエリア（3塁側）
  zones.set('foul-left', {
    id: 'foul-left',
    judgmentType: 'foul',
    boundingBox: {
      min: new Vector3(-60, -1, -10),
      max: new Vector3(-15, 15, 40)
    },
    priority: 0,
    label: '左側ファウルエリア',
    color: '#6b7280',
    description: '3塁側ファウルテリトリー'
  });
  
  // 右側ファウルエリア（1塁側）
  zones.set('foul-right', {
    id: 'foul-right',
    judgmentType: 'foul',
    boundingBox: {
      min: new Vector3(15, -1, -10),
      max: new Vector3(60, 15, 40)
    },
    priority: 0,
    label: '右側ファウルエリア',
    color: '#6b7280',
    description: '1塁側ファウルテリトリー'
  });
  
  // === アウトエリア ===
  
  // フライアウトエリア（中空）
  zones.set('fly-out', {
    id: 'fly-out',
    judgmentType: 'out',
    boundingBox: {
      min: new Vector3(-25, 3, 10),
      max: new Vector3(25, 20, 50)
    },
    priority: 6,
    label: 'フライアウトエリア',
    color: '#dc2626',
    description: '守備可能な高さでのフライアウト'
  });
  
  // ゴロアウトエリア（内野）
  zones.set('ground-out', {
    id: 'ground-out',
    judgmentType: 'out',
    boundingBox: {
      min: new Vector3(-18, -1, 3),
      max: new Vector3(18, 2, 25)
    },
    priority: 7,
    label: 'ゴロアウトエリア',
    color: '#b91c1c',
    description: '内野ゴロでのアウト'
  });
  
  // === 特殊エリア ===
  
  // 直後エリア（キャッチャー範囲）
  zones.set('catcher-zone', {
    id: 'catcher-zone',
    judgmentType: 'out',
    boundingBox: {
      min: new Vector3(-3, -1, -5),
      max: new Vector3(3, 3, 2)
    },
    priority: 10,
    label: 'キャッチャーエリア',
    color: '#7c2d12',
    description: 'キャッチャーが処理可能なエリア'
  });
  
  return zones;
};

// フィールド全体の境界定義
export const FIELD_BOUNDS = {
  min: new Vector3(-70, -2, -15),
  max: new Vector3(70, 60, 140)
};

// 座標系定数
export const FIELD_COORDINATES = {
  HOME_PLATE: new Vector3(0, 0, 0),
  FIRST_BASE: new Vector3(20, 0, 20),
  SECOND_BASE: new Vector3(0, 0, 30),
  THIRD_BASE: new Vector3(-20, 0, 20),
  PITCHERS_MOUND: new Vector3(0, 0, 18),
} as const;

// デバッグ用カラーパレット
export const ZONE_COLORS = {
  SINGLE: '#22c55e',
  DOUBLE: '#3b82f6', 
  TRIPLE: '#f59e0b',
  HOMERUN: '#ef4444',
  FOUL: '#6b7280',
  OUT: '#dc2626',
  SPECIAL: '#7c2d12'
} as const;