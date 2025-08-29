import { Vector3 } from 'three';
import { FieldZone, FieldMapConfig, SpatialGrid } from '@/types/field/fieldZone';
import { HitJudgmentResult } from '@/types/field/hitJudgment';
import { createFieldZoneMap, FIELD_BOUNDS } from '@/constants/field/FieldZoneDefinitions';

/**
 * スタジアム全体をマップとして管理するシステム
 * 空間分割による効率的な位置検索を提供
 */
export class StadiumFieldMap {
  private zones: Map<string, FieldZone>;
  private spatialGrid: SpatialGrid;
  private config: FieldMapConfig;

  constructor(config?: Partial<FieldMapConfig>) {
    this.config = {
      gridSize: 10,
      fieldBounds: FIELD_BOUNDS,
      ...config
    };

    this.zones = createFieldZoneMap();
    this.spatialGrid = this.createSpatialGrid();
  }

  /**
   * 効率的な位置検索のための空間分割システム
   * フィールドを格子状に分割してゾーンをマッピング
   */
  private createSpatialGrid(): SpatialGrid {
    const grid: SpatialGrid = {
      gridSize: this.config.gridSize,
      cells: new Map<string, string[]>()
    };

    this.zones.forEach((zone, id) => {
      const { min, max } = zone.boundingBox;
      
      // ゾーンが占有するグリッドセルを計算
      const minGridX = Math.floor(min.x / this.config.gridSize);
      const maxGridX = Math.floor(max.x / this.config.gridSize);
      const minGridZ = Math.floor(min.z / this.config.gridSize);
      const maxGridZ = Math.floor(max.z / this.config.gridSize);
      
      for (let gx = minGridX; gx <= maxGridX; gx++) {
        for (let gz = minGridZ; gz <= maxGridZ; gz++) {
          const gridKey = `${gx},${gz}`;
          if (!grid.cells.has(gridKey)) {
            grid.cells.set(gridKey, []);
          }
          grid.cells.get(gridKey)!.push(id);
        }
      }
    });
    
    return grid;
  }

  /**
   * 指定位置の判定エリアを効率的に検索
   * 空間分割により O(1) に近い検索速度を実現
   */
  public getZoneAtPosition(position: Vector3): FieldZone | null {
    const gridKey = `${Math.floor(position.x / this.config.gridSize)},${Math.floor(position.z / this.config.gridSize)}`;
    const potentialZones = this.spatialGrid.cells.get(gridKey) || [];
    
    // 優先度順でチェック（高い優先度が優先）
    const sortedZones = potentialZones
      .map(id => this.zones.get(id)!)
      .filter(zone => zone) // undefined除去
      .sort((a, b) => b.priority - a.priority);
    
    for (const zone of sortedZones) {
      if (this.isPositionInZone(position, zone)) {
        return zone;
      }
    }
    
    return null;
  }

  /**
   * 位置がゾーン内にあるかチェック
   */
  private isPositionInZone(position: Vector3, zone: FieldZone): boolean {
    const { min, max } = zone.boundingBox;
    return position.x >= min.x && position.x <= max.x &&
           position.y >= min.y && position.y <= max.y &&
           position.z >= min.z && position.z <= max.z;
  }

  /**
   * ボール落下位置から打球判定を実行
   */
  public evaluateBallLanding(position: Vector3, metadata?: {
    velocity?: Vector3;
    ballId?: string;
  }): HitJudgmentResult | null {
    const zone = this.getZoneAtPosition(position);
    
    if (!zone) {
      // どのゾーンにも該当しない場合はファウルとして扱う
      return {
        judgmentType: 'foul',
        position: position.clone(),
        zoneId: 'out-of-bounds',
        timestamp: Date.now(),
        metadata: {
          distance: position.length(),
          height: position.y,
          velocity: metadata?.velocity
        }
      };
    }

    return {
      judgmentType: zone.judgmentType,
      position: position.clone(),
      zoneId: zone.id,
      timestamp: Date.now(),
      metadata: {
        distance: position.length(),
        height: position.y,
        velocity: metadata?.velocity
      }
    };
  }

  /**
   * ゾーンの動的追加
   */
  public addZone(zone: FieldZone): void {
    this.zones.set(zone.id, zone);
    this.spatialGrid = this.createSpatialGrid(); // 再構築
  }

  /**
   * ゾーンの動的削除
   */
  public removeZone(zoneId: string): boolean {
    const existed = this.zones.delete(zoneId);
    if (existed) {
      this.spatialGrid = this.createSpatialGrid(); // 再構築
    }
    return existed;
  }

  /**
   * ゾーンの更新
   */
  public updateZone(zoneId: string, updates: Partial<FieldZone>): boolean {
    const zone = this.zones.get(zoneId);
    if (!zone) return false;

    const updatedZone = { ...zone, ...updates };
    this.zones.set(zoneId, updatedZone);
    
    // バウンディングボックスが変更された場合は空間グリッドを再構築
    if (updates.boundingBox) {
      this.spatialGrid = this.createSpatialGrid();
    }
    
    return true;
  }

  /**
   * 全ゾーンの取得
   */
  public getAllZones(): Map<string, FieldZone> {
    return new Map(this.zones);
  }

  /**
   * 特定ゾーンの取得
   */
  public getZone(zoneId: string): FieldZone | undefined {
    return this.zones.get(zoneId);
  }

  /**
   * 統計情報の取得
   */
  public getStatistics(): {
    totalZones: number;
    gridCells: number;
    averageZonesPerCell: number;
    maxZonesInCell: number;
  } {
    let maxZonesInCell = 0;
    let totalZoneReferences = 0;

    this.spatialGrid.cells.forEach((zones) => {
      totalZoneReferences += zones.length;
      maxZonesInCell = Math.max(maxZonesInCell, zones.length);
    });

    return {
      totalZones: this.zones.size,
      gridCells: this.spatialGrid.cells.size,
      averageZonesPerCell: totalZoneReferences / this.spatialGrid.cells.size,
      maxZonesInCell
    };
  }

  /**
   * デバッグ情報の取得
   */
  public getDebugInfo(): {
    config: FieldMapConfig;
    statistics: ReturnType<typeof this.getStatistics>;
    zoneList: Array<{id: string, priority: number, judgmentType: string}>;
  } {
    const zoneList = Array.from(this.zones.values()).map(zone => ({
      id: zone.id,
      priority: zone.priority,
      judgmentType: zone.judgmentType
    }));

    return {
      config: this.config,
      statistics: this.getStatistics(),
      zoneList
    };
  }
}