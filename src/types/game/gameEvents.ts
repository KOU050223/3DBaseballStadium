import { CountState, PlayResult } from './gameState';

/**
 * ゲーム中に発生するイベントを記録するインターフェース
 */
export interface GameEvent {
  /** イベントの種類 ('strike' | 'ball' | 'hit' | 'homerun' | 'foul' | 'out') */
  type: PlayResult;

  /** イベントが発生した時刻（ミリ秒タイムスタンプ） */
  timestamp: number;

  /** イベントの詳細説明 */
  description: string;

  /** イベント発生前のカウント状態 */
  countBefore: CountState;

  /** イベント発生後のカウント状態 */
  countAfter: CountState;
}

/**
 * ゲームイベントの拡張型（将来的な機能拡張用）
 */
export interface ExtendedGameEvent extends GameEvent {
  /** イベントに関連する追加データ（オプション） */
  metadata?: {
    [key: string]: unknown;
  };

  /** このイベントに関連する前後のイベントID（オプション） */
  relatedEvents?: string[];
}