'use client';

import { useState, useMemo } from 'react';
import { useFieldZoneManager } from '@/hooks/field/useFieldZoneManager';
import { FieldZone } from './FieldZone';
import { FieldZone as FieldZoneType } from '@/types/field/fieldZone';
import { FIELD_COORDINATES } from '@/constants/field/FieldZoneDefinitions';

interface StadiumFieldVisualizerProps {
  visible?: boolean;
  showDebugInfo?: boolean;
  wireframe?: boolean;
  opacity?: number;
  filterByType?: string[];
  animated?: boolean;
}

/**
 * スタジアム全体のフィールドゾーンを可視化するコンポーネント
 * 全てのゾーンを統合的に管理・表示
 */
export const StadiumFieldVisualizer = ({
  visible = true,
  showDebugInfo: _showDebugInfo = false,
  wireframe = false,
  opacity = 0.3,
  filterByType,
  animated = false
}: StadiumFieldVisualizerProps) => {
  const { getAllZones, isDebugMode } = useFieldZoneManager();
  const [_hoveredZone, setHoveredZone] = useState<FieldZoneType | null>(null);
  const [selectedZone, setSelectedZone] = useState<FieldZoneType | null>(null);

  // 全ゾーンの取得とフィルタリング
  const zones = useMemo(() => {
    const allZones = Array.from(getAllZones().values());
    
    if (!filterByType) return allZones;
    
    return allZones.filter(zone => 
      filterByType.includes(zone.judgmentType)
    );
  }, [getAllZones, filterByType]);

  // 統計情報の計算
  const _statistics = useMemo(() => {
    const typeCount = zones.reduce((acc, zone) => {
      acc[zone.judgmentType] = (acc[zone.judgmentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalZones: zones.length,
      typeCount,
      visibleZones: zones.filter(() => visible).length
    };
  }, [zones, visible]);

  const handleZoneHover = (zone: FieldZoneType | null) => {
    setHoveredZone(zone);
    // 将来的にホバー効果やデバッグ情報表示に使用
  };

  const handleZoneClick = (zone: FieldZoneType) => {
    setSelectedZone(selectedZone?.id === zone.id ? null : zone);
  };

  if (!visible) return null;

  return (
    <group name="stadium-field-visualizer">
      {/* 各フィールドゾーンの描画 */}
      {zones.map((zone) => (
        <FieldZone
          key={zone.id}
          zone={zone}
          visible={visible}
          opacity={selectedZone?.id === zone.id ? opacity * 2 : opacity}
          wireframe={wireframe}
          animated={animated}
          onHover={handleZoneHover}
          onClick={handleZoneClick}
        />
      ))}

      {/* ベースマーカー（参考用） */}
      <group name="base-markers">
        {/* ホームプレート */}
        <mesh position={[FIELD_COORDINATES.HOME_PLATE.x, 0.1, FIELD_COORDINATES.HOME_PLATE.z]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>

        {/* 1塁 */}
        <mesh position={[FIELD_COORDINATES.FIRST_BASE.x, 0.1, FIELD_COORDINATES.FIRST_BASE.z]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>

        {/* 2塁 */}
        <mesh position={[FIELD_COORDINATES.SECOND_BASE.x, 0.1, FIELD_COORDINATES.SECOND_BASE.z]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>

        {/* 3塁 */}
        <mesh position={[FIELD_COORDINATES.THIRD_BASE.x, 0.1, FIELD_COORDINATES.THIRD_BASE.z]}>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>

        {/* ピッチャーマウンド */}
        <mesh position={[FIELD_COORDINATES.PITCHERS_MOUND.x, 0.2, FIELD_COORDINATES.PITCHERS_MOUND.z]}>
          <cylinderGeometry args={[1.5, 1.5, 0.4]} />
          <meshLambertMaterial color="#8b4513" />
        </mesh>
      </group>

      {/* フィールド境界線（デバッグ用）*/}
      {isDebugMode && (
        <group name="field-boundaries">
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(140, 1, 155)]} />
            <lineBasicMaterial color="#ffffff" opacity={0.5} transparent />
          </lineSegments>
        </group>
      )}
    </group>
  );
};

/**
 * フィールドゾーンの統計情報を表示するHUDコンポーネント
 */
export const FieldZoneStatsHUD = () => {
  const { 
    getAllZones, 
    isDebugMode, 
    toggleDebugMode, 
    judgmentHistory,
    getPerformanceStats 
  } = useFieldZoneManager();

  const zones = Array.from(getAllZones().values());
  const performanceStats = getPerformanceStats();

  const typeCount = zones.reduce((acc, zone) => {
    acc[zone.judgmentType] = (acc[zone.judgmentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm max-w-xs">
      <h3 className="text-lg font-bold mb-2">Field Zone Stats</h3>
      
      {/* ゾーン統計 */}
      <div className="mb-3">
        <h4 className="font-semibold mb-1">Zone Count by Type:</h4>
        {Object.entries(typeCount).map(([type, count]) => (
          <div key={type} className="flex justify-between">
            <span className="capitalize">{type}:</span>
            <span>{count}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold border-t pt-1">
          <span>Total:</span>
          <span>{zones.length}</span>
        </div>
      </div>

      {/* 最近の判定履歴 */}
      <div className="mb-3">
        <h4 className="font-semibold mb-1">Recent Judgments:</h4>
        <div className="max-h-20 overflow-y-auto">
          {judgmentHistory.slice(-3).map((judgment, idx) => (
            <div key={idx} className="text-xs">
              {judgment.judgmentType} in {judgment.zoneId}
            </div>
          ))}
          {judgmentHistory.length === 0 && (
            <div className="text-xs text-gray-400">No judgments yet</div>
          )}
        </div>
      </div>

      {/* パフォーマンス統計 */}
      {isDebugMode && (
        <div className="mb-3">
          <h4 className="font-semibold mb-1">Performance:</h4>
          <div className="text-xs">
            <div>Grid Cells: {performanceStats.fieldMap.gridCells}</div>
            <div>Avg Zones/Cell: {performanceStats.fieldMap.averageZonesPerCell.toFixed(1)}</div>
            <div>Active Balls: {performanceStats.ballFlight.activeTracking}</div>
          </div>
        </div>
      )}

      {/* デバッグトグル */}
      <button
        onClick={toggleDebugMode}
        className={`w-full px-2 py-1 rounded text-xs ${
          isDebugMode 
            ? 'bg-yellow-600 hover:bg-yellow-700' 
            : 'bg-gray-600 hover:bg-gray-700'
        }`}
      >
        {isDebugMode ? 'Hide Debug' : 'Show Debug'}
      </button>
    </div>
  );
};

/**
 * フィールドゾーン表示コントロール
 */
export const FieldZoneControls = () => {
  const [showZones, setShowZones] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [opacity, setOpacity] = useState(0.3);
  const [filterType, setFilterType] = useState<string[]>([]);

  const judgmentTypes = ['single', 'double', 'triple', 'homerun', 'foul', 'out'];

  const handleTypeFilter = (type: string, checked: boolean) => {
    if (checked) {
      setFilterType(prev => [...prev, type]);
    } else {
      setFilterType(prev => prev.filter(t => t !== type));
    }
  };

  return (
    <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="text-lg font-bold mb-2">Field Zone Controls</h3>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showZones}
            onChange={(e) => setShowZones(e.target.checked)}
            className="mr-2"
          />
          Show Zones
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={(e) => setWireframe(e.target.checked)}
            className="mr-2"
          />
          Wireframe
        </label>

        <div>
          <label className="block mb-1">Opacity: {opacity.toFixed(1)}</label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block mb-1">Filter by Type:</label>
          <div className="space-y-1">
            {judgmentTypes.map(type => (
              <label key={type} className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={filterType.includes(type)}
                  onChange={(e) => handleTypeFilter(type, e.target.checked)}
                  className="mr-2 scale-75"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};