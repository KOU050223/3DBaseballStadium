// 野球のカウント状態
export interface CountState {
  strikes: number;    // ストライク数 (0-2)
  balls: number;      // ボール数 (0-3)
  outs: number;       // アウト数 (0-2)
}

// ランナー状態（各ベースにランナーがいるかどうか）
export interface RunnerState {
  first: boolean;     // 1塁にランナーがいるか
  second: boolean;    // 2塁にランナーがいるか
  third: boolean;     // 3塁にランナーがいるか
}

// チーム情報
export interface TeamState {
  score: number;      // 得点
  hits: number;       // ヒット数
  errors: number;     // エラー数
  runners: RunnerState; // ランナー状況
}

// イニング情報
export interface InningState {
  current: number;    // 現在のイニング
  isTop: boolean;     // 表裏の判定（true: 表, false: 裏）
}

// ゲーム全体の状態
export interface GameState {
  count: CountState;
  homeTeam: TeamState;
  awayTeam: TeamState;
  inning: InningState;
  isGameActive: boolean;
  currentBatter: 'home' | 'away';
}

// ゲーム結果の種類
export type PlayResult = 
  | 'strike' 
  | 'ball' 
  | 'single'      // 単打（1塁打）
  | 'double'      // 二塁打
  | 'triple'      // 三塁打
  | 'homerun'     // 本塁打
  | 'foul' 
  | 'out'
  | 'walk'        // 四球（ボール）
  | 'strikeout';  // 三振（ストライク）

// ヒットの種類（詳細分析用）
export type HitType = 
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun';

// ランナーの進塁結果
export interface RunnerAdvancement {
  from: 'batter' | 'first' | 'second' | 'third';
  to: 'first' | 'second' | 'third' | 'home';
  scored: boolean; // ホームインしたかどうか
}
