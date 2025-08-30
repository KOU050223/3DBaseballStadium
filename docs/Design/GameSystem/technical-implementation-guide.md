# 野球ゲーム状態管理システム - 技術実装ガイド

## 概要

このドキュメントはAI開発者が野球ゲーム状態管理システムを理解し、拡張・修正を行うための技術リファレンスです。

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                    3D Baseball Game                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ├── GameStateDisplay.tsx (ゲーム状況表示)                 │
│  ├── GameControls.tsx (ゲーム制御UI)                       │
│  └── Scoreboard.tsx (スコアボード)                         │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer (Zustand)                          │
│  ├── gameStore.ts (メイン状態管理)                         │
│  └── selectors (最適化されたセレクター)                     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  ├── GameRuleEngine.ts (ゲームルールエンジン)               │
│  └── CollisionDetector.ts (衝突判定システム)                │
├─────────────────────────────────────────────────────────────┤
│  Type System                                                │
│  ├── gameState.ts (基本型定義)                             │
│  └── gameEvents.ts (イベント型定義)                        │
└─────────────────────────────────────────────────────────────┘
```

## ファイル構造

```
src/
├── types/game/
│   ├── gameState.ts           # 基本型定義
│   └── gameEvents.ts          # イベント型定義
├── stores/
│   └── gameStore.ts           # Zustand状態管理
├── components/game/
│   ├── GameStateDisplay.tsx   # 状態表示UI
│   ├── GameControls.tsx       # ゲーム制御UI (未実装)
│   └── Scoreboard.tsx         # スコアボード (未実装)
├── services/game/
│   ├── GameRuleEngine.ts      # ルールエンジン (未実装)
│   └── CollisionDetector.ts   # 衝突判定 (未実装)
└── constants/game/
    └── GameConstants.ts       # ゲーム定数 (未実装)
```

## 型定義システム

### 1. 基本型 (`src/types/game/gameState.ts`)

```typescript
// カウント状態
interface CountState {
  strikes: number;    // 0-2
  balls: number;      // 0-3  
  outs: number;       // 0-2
}

// ランナー状態
interface RunnerState {
  first: boolean;     // 1塁
  second: boolean;    // 2塁
  third: boolean;     // 3塁
}

// チーム情報
interface TeamState {
  score: number;      // 得点
  hits: number;       // ヒット数
  errors: number;     // エラー数
  runners: RunnerState; // ランナー状況
}

// イニング情報
interface InningState {
  current: number;    // 現在のイニング (1-9+)
  isTop: boolean;     // true:表, false:裏
}

// ゲーム全体状態
interface GameState {
  count: CountState;
  homeTeam: TeamState;
  awayTeam: TeamState;
  inning: InningState;
  isGameActive: boolean;
  currentBatter: 'home' | 'away';
}
```

### 2. プレイ結果型

```typescript
type PlayResult = 
  | 'strike'      // ストライク
  | 'ball'        // ボール
  | 'single'      // 単打
  | 'double'      // 二塁打
  | 'triple'      // 三塁打
  | 'homerun'     // 本塁打
  | 'foul'        // ファウル
  | 'out'         // アウト
  | 'walk'        // 四球
  | 'strikeout';  // 三振

type HitType = 'single' | 'double' | 'triple' | 'homerun';
```

### 3. 進塁結果型

```typescript
interface RunnerAdvancement {
  from: 'batter' | 'first' | 'second' | 'third';
  to: 'first' | 'second' | 'third' | 'home';
  scored: boolean; // ホームインしたかどうか
}
```

## Zustand状態管理システム

### 1. ストア構造 (`src/stores/gameStore.ts`)

```typescript
interface GameStore extends GameState {
  // カウント操作
  addStrike: () => void;
  addBall: () => void;
  addOut: () => void;
  resetCount: () => void;
  
  // スコア・ヒット操作
  addScore: (team: 'home' | 'away', points: number) => void;
  addHit: (team: 'home' | 'away', hitType?: HitType) => void;
  addError: (team: 'home' | 'away') => void;
  
  // ランナー操作
  setRunner: (team: 'home' | 'away', base: 'first' | 'second' | 'third', hasRunner: boolean) => void;
  clearRunners: (team: 'home' | 'away') => void;
  advanceRunners: (team: 'home' | 'away', hitType: HitType) => RunnerAdvancement[];
  processRunnerScoring: (team: 'home' | 'away', advancements: RunnerAdvancement[]) => void;
  
  // イニング操作
  nextInning: () => void;
  setInning: (inning: number, isTop: boolean) => void;
  
  // ゲーム制御
  startGame: () => void;
  resetGame: () => void;
  endGame: () => void;
  processPlayResult: (result: PlayResult) => void;
  
  // 派生状態ゲッター
  getCountDisplay: () => string;
  getInningDisplay: () => string;
  getScoreDisplay: () => string;
  isGameOver: () => boolean;
  getWinningTeam: () => 'home' | 'away' | 'tie' | null;
}
```

### 2. 初期状態

```typescript
const initialGameState: GameState = {
  count: { strikes: 0, balls: 0, outs: 0 },
  homeTeam: { 
    score: 0, hits: 0, errors: 0,
    runners: { first: false, second: false, third: false }
  },
  awayTeam: { 
    score: 0, hits: 0, errors: 0,
    runners: { first: false, second: false, third: false }
  },
  inning: { current: 1, isTop: true },
  isGameActive: false,
  currentBatter: 'away'
};
```

### 3. 最適化されたセレクター

```typescript
// パフォーマンス最適化用セレクター
export const useGameCount = () => useGameStore((state) => state.count);
export const useGameScore = () => useGameStore((state) => ({ 
  home: state.homeTeam, 
  away: state.awayTeam 
}));
export const useGameInning = () => useGameStore((state) => state.inning);
export const useGameStatus = () => useGameStore((state) => state.isGameActive);

// アクション専用セレクター（再レンダリング回避）
export const useGameActions = () => useGameStore((state) => ({
  addStrike: state.addStrike,
  addBall: state.addBall,
  addOut: state.addOut,
  addHit: state.addHit,
  addScore: state.addScore,
  startGame: state.startGame,
  resetGame: state.resetGame,
  processPlayResult: state.processPlayResult
}));
```

## 進塁ロジック実装

### 1. ヒット処理のフロー

```typescript
// src/stores/gameStore.ts の addHit メソッド
addHit: (team, hitType = 'single') => {
  const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
  
  // ステップ1: ランナー進塁計算
  const advancements = get().advanceRunners(team, hitType);
  
  // ステップ2: 得点処理
  get().processRunnerScoring(team, advancements);
  
  // ステップ3: ヒット数更新
  set((state) => ({
    [teamKey]: {
      ...state[teamKey],
      hits: state[teamKey].hits + 1
    }
  }));
  
  // ステップ4: カウントリセット
  get().resetCount();
},
```

### 2. 進塁計算アルゴリズム

```typescript
advanceRunners: (team, hitType) => {
  const { homeTeam, awayTeam } = get();
  const currentTeam = team === 'home' ? homeTeam : awayTeam;
  const advancements: RunnerAdvancement[] = [];
  
  // バッターの進塁先決定
  const batterDestination = {
    'single': 'first',
    'double': 'second', 
    'triple': 'third',
    'homerun': 'home'
  }[hitType];
  
  advancements.push({
    from: 'batter',
    to: batterDestination,
    scored: batterDestination === 'home'
  });
  
  // 既存ランナーの進塁処理
  if (currentTeam.runners.third) {
    // 3塁ランナーは基本的にホームイン
    advancements.push({
      from: 'third', to: 'home', scored: true
    });
  }
  
  if (currentTeam.runners.second) {
    const destination = hitType === 'single' ? 'third' : 'home';
    advancements.push({
      from: 'second',
      to: destination,
      scored: destination === 'home'
    });
  }
  
  if (currentTeam.runners.first) {
    const destinations = {
      'single': 'second',
      'double': 'third',
      'triple': 'home',
      'homerun': 'home'
    };
    const destination = destinations[hitType];
    
    advancements.push({
      from: 'first',
      to: destination,
      scored: destination === 'home'
    });
  }
  
  return advancements;
},
```

### 3. 得点・ランナー更新処理

```typescript
processRunnerScoring: (team, advancements) => {
  const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
  
  // 得点計算
  const runsScored = advancements.filter(a => a.scored).length;
  if (runsScored > 0) {
    get().addScore(team, runsScored);
  }
  
  // ランナー状態更新
  set((state) => {
    const newRunners = { first: false, second: false, third: false };
    
    // 生存ランナーを新しい位置に配置
    advancements.forEach(advancement => {
      if (!advancement.scored && advancement.to !== 'home') {
        newRunners[advancement.to as keyof RunnerState] = true;
      }
    });
    
    return {
      [teamKey]: {
        ...state[teamKey],
        runners: newRunners
      }
    };
  });
},
```

## UI実装パターン

### 1. 基本的なコンポーネント構造

```typescript
'use client';

import React from 'react';
import { useGameStore } from '@/stores/gameStore';

export const GameComponent: React.FC = () => {
  // 状態の取得
  const countDisplay = useGameStore((state) => state.getCountDisplay());
  const scoreDisplay = useGameStore((state) => state.getScoreDisplay());
  const inningDisplay = useGameStore((state) => state.getInningDisplay());
  
  // アクションの取得
  const { processPlayResult, startGame, resetGame } = useGameActions();
  
  return (
    <div>
      {/* 状態表示 */}
      <div>{scoreDisplay}</div>
      <div>{inningDisplay}</div>  
      <div>{countDisplay}</div>
      
      {/* 操作ボタン */}
      <button onClick={() => processPlayResult('single')}>
        単打
      </button>
    </div>
  );
};
```

### 2. ランナー状況表示

```typescript
const RunnerDisplay: React.FC = () => {
  const currentBatter = useGameStore((state) => state.currentBatter);
  const runners = useGameStore((state) => 
    currentBatter === 'home' ? state.homeTeam.runners : state.awayTeam.runners
  );
  
  return (
    <div className="grid grid-cols-3 gap-1">
      {(['first', 'second', 'third'] as const).map(base => (
        <div 
          key={base}
          className={`p-1 text-center rounded ${
            runners[base] ? 'bg-green-600' : 'bg-gray-600'
          }`}
        >
          {base === 'first' ? '1塁' : base === 'second' ? '2塁' : '3塁'}
        </div>
      ))}
    </div>
  );
};
```

## 3Dシステム統合パターン

### 1. 物理演算との連携

```typescript
// BattingMachine.tsx での統合例
import { useGameStore } from '@/stores/gameStore';

const BattingMachine: React.FC = () => {
  const processPlayResult = useGameStore((state) => state.processPlayResult);
  
  // ボール軌道の判定
  const checkBallResult = (ballPosition: Vector3, velocity: Vector3) => {
    if (isInStrikeZone(ballPosition)) {
      processPlayResult('strike');
    } else {
      processPlayResult('ball');
    }
  };
  
  // バット衝突の判定
  const checkBatCollision = (impactForce: number, angle: number) => {
    const hitType = calculateHitType(impactForce, angle);
    processPlayResult(hitType);
  };
  
  return (
    // 3D コンポーネント
    <BallPhysics onBallUpdate={checkBallResult} />
  );
};
```

### 2. ヒット種類判定アルゴリズム

```typescript
// services/game/GameRuleEngine.ts (未実装 - 実装予定)
export class GameRuleEngine {
  static calculateHitType(velocity: Vector3, angle: number): HitType {
    const speed = velocity.length();
    const launchAngle = Math.abs(angle);
    
    if (speed < 15) return 'out'; // フライアウト
    if (speed > 40 && launchAngle > 15 && launchAngle < 45) {
      return 'homerun';
    }
    if (speed > 30) return 'triple';
    if (speed > 25) return 'double';
    return 'single';
  }
  
  static isStrike(ballPosition: Vector3): boolean {
    const { x, y, z } = ballPosition;
    return (
      Math.abs(x) <= STRIKE_ZONE.width / 2 &&
      y >= STRIKE_ZONE.height.bottom &&
      y <= STRIKE_ZONE.height.top &&
      Math.abs(z) <= STRIKE_ZONE.depth
    );
  }
}
```

## 拡張実装ガイド

### 1. 新しいプレイ結果の追加

```typescript
// 1. 型定義に追加
type PlayResult = 
  | '既存の型...'
  | 'sacrifice'    // 犠牲フライ
  | 'steal';       // 盗塁

// 2. processPlayResult に処理を追加
case 'sacrifice':
  // 犠牲フライロジック
  get().addOut();
  if (get().currentTeam.runners.third) {
    get().addScore(currentBatter, 1);
    get().setRunner(currentBatter, 'third', false);
  }
  break;
```

### 2. 新しいUIコンポーネントの追加

```typescript
// src/components/game/DetailedStats.tsx
export const DetailedStats: React.FC = () => {
  const { home, away } = useGameScore();
  const inning = useGameInning();
  
  // 詳細統計の計算
  const homeAvg = home.hits / Math.max(home.atBats || 1, 1);
  
  return (
    <div className="stats-panel">
      {/* 詳細統計表示 */}
    </div>
  );
};
```

### 3. カスタムフック作成

```typescript
// src/hooks/useGameAnalytics.ts
export const useGameAnalytics = () => {
  const { home, away } = useGameScore();
  const inning = useGameInning();
  
  return useMemo(() => {
    return {
      totalHits: home.hits + away.hits,
      totalScore: home.score + away.score,
      isCloseGame: Math.abs(home.score - away.score) <= 2,
      inningProgress: inning.current / 9
    };
  }, [home, away, inning]);
};
```

## デバッグ・テスト

### 1. 開発用デバッグ関数

```typescript
// 開発環境でのみ有効
if (process.env.NODE_ENV === 'development') {
  (window as any).debugGame = {
    // ゲーム状態の強制設定
    setGameState: (state: Partial<GameState>) => {
      useGameStore.setState(state);
    },
    
    // 特定シチュエーションの作成
    createSituation: {
      fullBases: () => {
        const currentBatter = useGameStore.getState().currentBatter;
        useGameStore.getState().setRunner(currentBatter, 'first', true);
        useGameStore.getState().setRunner(currentBatter, 'second', true);
        useGameStore.getState().setRunner(currentBatter, 'third', true);
      },
      
      twoOutsFullCount: () => {
        useGameStore.setState({
          count: { strikes: 2, balls: 3, outs: 2 }
        });
      }
    }
  };
}
```

### 2. 単体テスト例

```typescript
// src/__tests__/stores/gameStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/stores/gameStore';

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });
  
  it('should process single hit correctly', () => {
    const { result } = renderHook(() => useGameStore());
    
    act(() => {
      result.current.processPlayResult('single');
    });
    
    expect(result.current.currentTeam.runners.first).toBe(true);
    expect(result.current.currentTeam.hits).toBe(1);
  });
});
```

## パフォーマンス考慮事項

### 1. 状態更新の最適化

```typescript
// ❌ 非効率: 大きなオブジェクトの購読
const gameState = useGameStore();

// ✅ 効率的: 必要な部分のみ購読
const count = useGameCount();
const isActive = useGameStatus();
```

### 2. 計算コストの削減

```typescript
// 重い計算をuseMemoでキャッシュ
const gameAnalytics = useMemo(() => {
  return calculateComplexStats(gameData);
}, [gameData.score, gameData.inning]);
```

### 3. 不要な再レンダリングの防止

```typescript
// アクション専用フックで再レンダリング回避
const actions = useGameActions();

// React.memoでコンポーネント最適化
export const GameStats = React.memo(() => {
  const stats = useGameScore();
  return <div>{/* stats display */}</div>;
});
```

## 今後の拡張予定

### 1. 実装予定機能

- [ ] GameRuleEngine.ts の完全実装
- [ ] CollisionDetector.ts の物理演算システム
- [ ] GameConstants.ts のゲーム定数管理
- [ ] 詳細統計システム
- [ ] リプレイ機能
- [ ] セーブ・ロード機能

### 2. 技術的改善点

- [ ] エラーハンドリングの強化
- [ ] ログシステムの導入
- [ ] パフォーマンス監視
- [ ] テストカバレッジの向上

### 3. ゲーム機能拡張

- [ ] 犠牲フライ・犠牲バント
- [ ] 盗塁システム
- [ ] 投手交代
- [ ] 代打・代走
- [ ] 延長戦

このドキュメントは実装の詳細を含む技術リファレンスとして、AI開発者が効率的にシステムを理解・拡張できるよう設計されています。