import { Vector3 } from 'three';
import { DistanceBasedJudgment } from '../DistanceBasedJudgment';

describe('DistanceBasedJudgment', () => {
  let judgment: DistanceBasedJudgment;
  const playerPosition = new Vector3(1.6, 1.4, 0); // バット位置

  beforeEach(() => {
    judgment = new DistanceBasedJudgment(playerPosition);
  });

  describe('距離に基づく判定', () => {
    test('近距離（15m）はアウト', () => {
      const ballPosition = new Vector3(5, 0, 15);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('out');
      expect(result.metadata?.distance).toBeLessThan(25);
    });

    test('内野安打エリア（30m）は単打', () => {
      const ballPosition = new Vector3(10, 1, 25);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('single');
      expect(result.metadata?.distance).toBeGreaterThan(25);
      expect(result.metadata?.distance).toBeLessThan(45);
    });

    test('外野安打エリア（50m）は単打', () => {
      const ballPosition = new Vector3(15, 1, 45);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('single');
      expect(result.metadata?.distance).toBeGreaterThan(45);
      expect(result.metadata?.distance).toBeLessThan(70);
    });

    test('二塁打エリア（75m）は二塁打', () => {
      const ballPosition = new Vector3(20, 2, 70);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('double');
      expect(result.metadata?.distance).toBeGreaterThan(70);
      expect(result.metadata?.distance).toBeLessThan(95);
    });

    test('三塁打エリア（100m）は三塁打', () => {
      const ballPosition = new Vector3(30, 3, 95);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('triple');
      expect(result.metadata?.distance).toBeGreaterThan(95);
      expect(result.metadata?.distance).toBeLessThan(130);
    });

    test('ホームランエリア（140m）はホームラン', () => {
      const ballPosition = new Vector3(40, 10, 130);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('homerun');
      expect(result.metadata?.distance).toBeGreaterThan(130);
    });
  });

  describe('ファウル判定', () => {
    test('極端な左側（X < -40）はファウル', () => {
      const ballPosition = new Vector3(-50, 2, 30);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('foul');
      expect(result.zoneId).toBe('foul-territory');
    });

    test('極端な右側（X > 40）はファウル', () => {
      const ballPosition = new Vector3(50, 2, 30);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('foul');
    });

    test('後方（Z < 0）はファウル', () => {
      const ballPosition = new Vector3(10, 2, -5);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('foul');
    });
  });

  describe('高さによる判定', () => {
    test('高いフライ（5m以上）で短距離（40m）はアウト', () => {
      const ballPosition = new Vector3(10, 6, 35);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('out');
      expect(result.metadata?.height).toBeGreaterThan(5);
    });

    test('内野での高い打球（2m以上）はアウト', () => {
      const ballPosition = new Vector3(8, 3, 25);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('out');
    });

    test('内野での低い打球（2m未満）は単打', () => {
      const ballPosition = new Vector3(8, 1, 25);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.judgmentType).toBe('single');
    });
  });

  describe('プレイヤー位置更新', () => {
    test('プレイヤー位置更新後の判定', () => {
      const newPlayerPosition = new Vector3(2.0, 1.4, 0);
      judgment.updatePlayerPosition(newPlayerPosition);
      
      const ballPosition = new Vector3(10, 1, 25);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.metadata?.playerPosition).toEqual(newPlayerPosition);
    });
  });

  describe('メタデータ', () => {
    test('結果にメタデータが含まれる', () => {
      const ballPosition = new Vector3(15, 2, 50);
      const result = judgment.judgeByDistance(ballPosition);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.distance).toBeDefined();
      expect(result.metadata?.height).toBe(2);
      expect(result.metadata?.actualDistance).toBeDefined();
      expect(result.metadata?.playerPosition).toEqual(playerPosition);
      expect(result.metadata?.calculationMethod).toBe('distance-based');
    });
  });
});