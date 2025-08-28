# 野球ゲーム状態管理システム - 使い方ガイド

## 概要

3D野球ゲームにおけるゲーム状態管理システムの使用方法について説明します。このシステムはZustandを使用したモダンな状態管理で、リアルタイムな野球ゲーム体験を提供します。

## 基本概念

### 主要なコンポーネント

1. **GameStore**: ゲーム全体の状態を管理するZustandストア
2. **GameStateDisplay**: ゲーム状況を表示するUIコンポーネント
3. **型定義**: TypeScriptによる厳密な型管理

## システムの導入

### 1. 必要なインポート

```typescript
import { useGameStore, useGameActions } from '@/stores/gameStore';
import { GameStateDisplay } from '@/components/game/GameStateDisplay';
```

### 2. 基本的な使用例

```typescript
'use client';

import React from 'react';
import { useGameStore, useGameActions } from '@/stores/gameStore';
import { GameStateDisplay } from '@/components/game/GameStateDisplay';

export const BaseballGame: React.FC = () => {
  // ゲームアクションを取得
  const { 
    startGame, 
    resetGame, 
    processPlayResult 
  } = useGameActions();
  
  // ゲーム状態を取得
  const isGameActive = useGameStore((state) => state.isGameActive);
  const countDisplay = useGameStore((state) => state.getCountDisplay());
  
  return (
    <div>
      <GameStateDisplay />
      
      <div className="controls">
        <button onClick={startGame} disabled={isGameActive}>
          ゲーム開始
        </button>
        <button onClick={resetGame}>
          リセット
        </button>
      </div>
      
      <div className="play-results">
        <button onClick={() => processPlayResult('single')}>
          単打
        </button>
        <button onClick={() => processPlayResult('double')}>
          二塁打
        </button>
        <button onClick={() => processPlayResult('triple')}>
          三塁打
        </button>
        <button onClick={() => processPlayResult('homerun')}>
          ホームラン
        </button>
      </div>
    </div>
  );
};
```

## プレイ結果の種類

### ヒット系

```typescript
// 単打（1塁打）
gameStore.processPlayResult('single');

// 二塁打
gameStore.processPlayResult('double');

// 三塁打
gameStore.processPlayResult('triple');

// ホームラン
gameStore.processPlayResult('homerun');
```

### カウント系

```typescript
// ストライク
gameStore.processPlayResult('strike');

// ボール
gameStore.processPlayResult('ball');

// ファウル（2ストライク未満でのみストライク追加）
gameStore.processPlayResult('foul');
```

### アウト系

```typescript
// 一般的なアウト
gameStore.processPlayResult('out');

// 三振
gameStore.processPlayResult('strikeout');
```

### 四球

```typescript
// 四球（1塁へ自動出塁）
gameStore.processPlayResult('walk');
```

## ランナー進塁システム

### 自動進塁ロジック

#### 単打（Single）の場合:
- バッター → 1塁
- 1塁ランナー → 2塁
- 2塁ランナー → 3塁
- 3塁ランナー → ホーム（得点）

```typescript
// 例：1塁、3塁にランナーがいる状況で単打
// 結果：バッター1塁、元1塁ランナー2塁、元3塁ランナー得点
processPlayResult('single');
```

#### 二塁打（Double）の場合:
- バッター → 2塁
- 1塁ランナー → 3塁
- 2塁・3塁ランナー → ホーム（得点）

```typescript
// 例：満塁で二塁打
// 結果：バッター2塁、2点得点
processPlayResult('double');
```

#### 三塁打（Triple）の場合:
- バッター → 3塁
- 全ランナー → ホーム（得点）

```typescript
// 例：満塁で三塁打
// 結果：バッター3塁、3点得点
processPlayResult('triple');
```

#### ホームラン（Homerun）の場合:
- 全員 → ホーム（得点）

```typescript
// 例：満塁でホームラン
// 結果：4点得点（グランドスラム）
processPlayResult('homerun');
```

## 手動ランナー操作

### 個別ランナー設定

```typescript
const { setRunner } = useGameActions();

// ホームチームの1塁にランナーを配置
setRunner('home', 'first', true);

// アウェーチームの2塁からランナーを除去
setRunner('away', 'second', false);
```

### ランナー一括クリア

```typescript
const { clearRunners } = useGameActions();

// ホームチームの全ランナーをクリア
clearRunners('home');

// アウェーチームの全ランナーをクリア
clearRunners('away');
```

## ゲーム制御

### ゲーム開始・終了

```typescript
const { startGame, endGame, resetGame } = useGameActions();

// ゲーム開始
startGame();

// ゲーム終了
endGame();

// ゲームリセット（初期状態に戻る）
resetGame();
```

### イニング操作

```typescript
const { nextInning, setInning } = useGameActions();

// 次のイニングへ進む（3アウトで自動実行）
nextInning();

// 特定のイニングに設定（テスト用）
setInning(9, false); // 9回裏に設定
```

## 状態の取得

### 最適化されたセレクター使用

```typescript
// 個別の状態を効率的に取得
const count = useGameCount();
const score = useGameScore(); 
const inning = useGameInning();
const isActive = useGameStatus();

console.log(`カウント: ${count.balls}-${count.strikes} ${count.outs}OUT`);
console.log(`スコア: HOME ${score.home.score} - ${score.away.score} AWAY`);
console.log(`イニング: ${inning.current}回${inning.isTop ? '表' : '裏'}`);
```

### 詳細なランナー情報取得

```typescript
const gameStore = useGameStore();

// 現在攻撃中チームのランナー情報
const currentBatter = gameStore.currentBatter;
const runners = currentBatter === 'home' 
  ? gameStore.homeTeam.runners 
  : gameStore.awayTeam.runners;

console.log(`1塁: ${runners.first ? 'ランナー有' : '空'}`);
console.log(`2塁: ${runners.second ? 'ランナー有' : '空'}`);
console.log(`3塁: ${runners.third ? 'ランナー有' : '空'}`);
```

## UIコンポーネントの使用

### GameStateDisplay

```typescript
import { GameStateDisplay } from '@/components/game/GameStateDisplay';

// ゲーム状態表示（固定位置に自動表示）
<GameStateDisplay />
```

表示内容：
- スコア情報（HOME x - x AWAY）
- イニング情報（x回表/裏）
- カウント情報（x-x xOUT）
- ランナー状況（1塁、2塁、3塁の状況を色分け表示）

## 3Dシステムとの連携

### BattingMachine連携例

```typescript
// BattingMachineコンポーネント内
import { useGameStore } from '@/stores/gameStore';

const BattingMachine: React.FC = () => {
  const processPlayResult = useGameStore((state) => state.processPlayResult);
  
  // ボールがストライクゾーンを通過した場合
  const onBallPassZone = (isStrike: boolean) => {
    if (isStrike) {
      processPlayResult('strike');
    } else {
      processPlayResult('ball');
    }
  };
  
  // バットとボールが衝突した場合
  const onBallHit = (hitPower: number) => {
    if (hitPower > 80) {
      processPlayResult('homerun');
    } else if (hitPower > 60) {
      processPlayResult('triple');
    } else if (hitPower > 40) {
      processPlayResult('double');
    } else {
      processPlayResult('single');
    }
  };
  
  // ...残りの実装
};
```

## エラーハンドリング

### 状態の整合性チェック

```typescript
// ゲーム終了判定
const isGameOver = useGameStore((state) => state.isGameOver());
const winningTeam = useGameStore((state) => state.getWinningTeam());

if (isGameOver) {
  console.log(`ゲーム終了: ${winningTeam === 'home' ? 'ホーム' : 'アウェー'}の勝利`);
}
```

### デバッグ用表示

```typescript
// 開発環境でのデバッグ情報
const debugInfo = useGameStore((state) => ({
  count: state.count,
  homeRunners: state.homeTeam.runners,
  awayRunners: state.awayTeam.runners,
  currentBatter: state.currentBatter
}));

console.log('デバッグ情報:', debugInfo);
```

## 応用例

### カスタムゲームモード

```typescript
const CustomGameMode: React.FC = () => {
  const { processPlayResult, setInning } = useGameActions();
  
  // 9回裏2アウト満塁のシチュエーション設定
  const setupDramaticSituation = () => {
    setInning(9, false); // 9回裏
    
    // 満塁設定
    setRunner('home', 'first', true);
    setRunner('home', 'second', true);  
    setRunner('home', 'third', true);
    
    // 2アウト設定
    // カウントを手動で調整する場合は直接状態を操作
  };
  
  return (
    <div>
      <button onClick={setupDramaticSituation}>
        劇的シチュエーション設定
      </button>
    </div>
  );
};
```

### 統計情報表示

```typescript
const GameStats: React.FC = () => {
  const { home, away } = useGameScore();
  
  return (
    <div className="stats">
      <h3>ゲーム統計</h3>
      <div>
        <p>HOME: {home.score}点 {home.hits}安打 {home.errors}失策</p>
        <p>AWAY: {away.score}点 {away.hits}安打 {away.errors}失策</p>
      </div>
    </div>
  );
};
```

## パフォーマンス最適化

### セレクターの使い分け

```typescript
// ❌ 非効率：大きなオブジェクト全体を購読
const gameState = useGameStore();

// ✅ 効率的：必要な部分のみ購読  
const count = useGameCount();
const score = useGameScore();
const actions = useGameActions(); // アクションのみ取得
```

### 再レンダリング最適化

```typescript
// アクション専用フックを使用（再レンダリングなし）
const actions = useGameActions();

// 状態変更専用フックを使用
const isGameActive = useGameStatus();
```

## まとめ

この野球ゲーム状態管理システムは：

- **リアルタイム更新**: Zustandによる高速状態管理
- **型安全性**: TypeScriptによる厳密な型チェック
- **自動化**: プレイ結果による自動進塁・得点計算
- **拡張性**: 新機能追加に対応しやすい設計
- **パフォーマンス**: 最適化されたセレクターによる効率的な更新

を特徴とし、本格的な野球ゲーム体験を提供します。

## トラブルシューティング

### よくある問題

1. **ランナーが進塁しない**
   - `processPlayResult`を正しいヒット種類で呼び出しているか確認
   - ランナー状態が正しく設定されているか確認

2. **得点が計算されない**
   - `processRunnerScoring`が自動実行されているか確認
   - ホームイン条件が満たされているか確認

3. **UIが更新されない**  
   - 適切なセレクターを使用しているか確認
   - Zustandストアから状態を取得しているか確認

詳細な問題については、開発チームにお問い合わせください。