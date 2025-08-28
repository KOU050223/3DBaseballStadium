import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameState, CountState, TeamState, InningState, PlayResult, RunnerState, HitType, RunnerAdvancement } from '@/types/game/gameState';

interface GameStore extends GameState {
  // === アクション ===
  // カウント操作
  addStrike: () => void;
  addBall: () => void;
  addOut: () => void;
  resetCount: () => void;
  
  // スコア操作
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
  
  // プレイ結果処理
  processPlayResult: (result: PlayResult) => void;
  
  // === 派生状態（ゲッター） ===
  getCountDisplay: () => string;
  getInningDisplay: () => string;
  getScoreDisplay: () => string;
  isGameOver: () => boolean;
  getWinningTeam: () => 'home' | 'away' | 'tie' | null;
}

const initialGameState: GameState = {
  count: { strikes: 0, balls: 0, outs: 0 },
  homeTeam: { 
    score: 0, 
    hits: 0, 
    errors: 0,
    runners: { first: false, second: false, third: false }
  },
  awayTeam: { 
    score: 0, 
    hits: 0, 
    errors: 0,
    runners: { first: false, second: false, third: false }
  },
  inning: { current: 1, isTop: true },
  isGameActive: false,
  currentBatter: 'away'
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialGameState,
    
    // === カウント操作 ===
    addStrike: () => {
      const { count } = get();
      const newStrikes = count.strikes + 1;
      
      if (newStrikes >= 3) {
        // 三振でアウト
        get().addOut();
      } else {
        set((state) => ({
          count: { ...state.count, strikes: newStrikes }
        }));
      }
    },
    
    addBall: () => {
      const { count } = get();
      const newBalls = count.balls + 1;
      
      if (newBalls >= 4) {
        // 四球で出塁
        set((state) => ({
          count: { strikes: 0, balls: 0, outs: state.count.outs }
        }));
        // TODO: 出塁処理
        console.log('四球で出塁');
      } else {
        set((state) => ({
          count: { ...state.count, balls: newBalls }
        }));
      }
    },
    
    addOut: () => {
      const { count } = get();
      const newOuts = count.outs + 1;
      
      if (newOuts >= 3) {
        // 3アウトでイニング終了
        get().nextInning();
      } else {
        set((state) => ({
          count: { strikes: 0, balls: 0, outs: newOuts }
        }));
      }
    },
    
    resetCount: () => {
      set((state) => ({
        count: { strikes: 0, balls: 0, outs: state.count.outs }
      }));
    },
    
    // === スコア操作 ===
    addScore: (team, points) => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      set((state) => ({
        [teamKey]: {
          ...state[teamKey],
          score: state[teamKey].score + points
        }
      }));
    },
    
    addHit: (team, hitType = 'single') => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      
      // ランナーの進塁処理
      const advancements = get().advanceRunners(team, hitType);
      get().processRunnerScoring(team, advancements);
      
      // ヒット数を増加
      set((state) => ({
        [teamKey]: {
          ...state[teamKey],
          hits: state[teamKey].hits + 1
        }
      }));
      get().resetCount();
    },
    
    addError: (team) => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      set((state) => ({
        [teamKey]: {
          ...state[teamKey],
          errors: state[teamKey].errors + 1
        }
      }));
    },
    
    // === ランナー操作 ===
    setRunner: (team, base, hasRunner) => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      set((state) => ({
        [teamKey]: {
          ...state[teamKey],
          runners: {
            ...state[teamKey].runners,
            [base]: hasRunner
          }
        }
      }));
    },
    
    clearRunners: (team) => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      set((state) => ({
        [teamKey]: {
          ...state[teamKey],
          runners: { first: false, second: false, third: false }
        }
      }));
    },
    
    advanceRunners: (team, hitType) => {
      const { homeTeam, awayTeam } = get();
      const currentTeam = team === 'home' ? homeTeam : awayTeam;
      const advancements: RunnerAdvancement[] = [];
      
      // バッターの進塁
      let batterAdvancesTo: 'first' | 'second' | 'third' | 'home';
      switch (hitType) {
        case 'single':
          batterAdvancesTo = 'first';
          break;
        case 'double':
          batterAdvancesTo = 'second';
          break;
        case 'triple':
          batterAdvancesTo = 'third';
          break;
        case 'homerun':
          batterAdvancesTo = 'home';
          break;
      }
      
      advancements.push({
        from: 'batter',
        to: batterAdvancesTo,
        scored: batterAdvancesTo === 'home'
      });
      
      // 既存ランナーの進塁
      if (currentTeam.runners.third) {
        // 3塁ランナーは基本的にホームイン
        advancements.push({
          from: 'third',
          to: 'home',
          scored: true
        });
      }
      
      if (currentTeam.runners.second) {
        if (hitType === 'single') {
          // 単打では2塁から3塁へ
          advancements.push({
            from: 'second',
            to: 'third',
            scored: false
          });
        } else {
          // 長打では2塁からホームイン
          advancements.push({
            from: 'second',
            to: 'home',
            scored: true
          });
        }
      }
      
      if (currentTeam.runners.first) {
        if (hitType === 'single') {
          // 単打では1塁から2塁へ
          advancements.push({
            from: 'first',
            to: 'second',
            scored: false
          });
        } else if (hitType === 'double') {
          // 二塁打では1塁から3塁へ
          advancements.push({
            from: 'first',
            to: 'third',
            scored: false
          });
        } else {
          // 三塁打・ホームランでは1塁からホームイン
          advancements.push({
            from: 'first',
            to: 'home',
            scored: true
          });
        }
      }
      
      return advancements;
    },
    
    processRunnerScoring: (team, advancements) => {
      const teamKey = team === 'home' ? 'homeTeam' : 'awayTeam';
      
      // 得点を計算
      const runsScored = advancements.filter(a => a.scored).length;
      if (runsScored > 0) {
        get().addScore(team, runsScored);
      }
      
      // ランナー状態を更新
      set((state) => {
        const newRunners = { first: false, second: false, third: false };
        
        // 生存ランナー（ホームイン以外）を新しい位置に配置
        advancements.forEach(advancement => {
          if (!advancement.scored && advancement.to !== 'home') {
            newRunners[advancement.to as 'first' | 'second' | 'third'] = true;
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
    
    // === イニング操作 ===
    nextInning: () => {
      const { inning } = get();
      
      if (inning.isTop) {
        // 表から裏へ
        set((state) => ({
          inning: { ...state.inning, isTop: false },
          currentBatter: 'home',
          count: { strikes: 0, balls: 0, outs: 0 }
        }));
      } else {
        // 裏から次のイニングの表へ
        set((state) => ({
          inning: { current: state.inning.current + 1, isTop: true },
          currentBatter: 'away',
          count: { strikes: 0, balls: 0, outs: 0 }
        }));
      }
    },
    
    setInning: (inning, isTop) => {
      set((state) => ({
        inning: { current: inning, isTop },
        currentBatter: isTop ? 'away' : 'home',
        count: { strikes: 0, balls: 0, outs: 0 }
      }));
    },
    
    // === ゲーム制御 ===
    startGame: () => {
      set({ isGameActive: true });
      console.log('ゲーム開始');
    },
    
    resetGame: () => {
      set(initialGameState);
    },
    
    endGame: () => {
      set({ isGameActive: false });
    },
    
    // === プレイ結果処理 ===
    processPlayResult: (result) => {
      const { currentBatter } = get();
      
      switch (result) {
        case 'strike':
          get().addStrike();
          break;
        case 'ball':
          get().addBall();
          break;
        case 'single':
          get().addHit(currentBatter, 'single');
          break;
        case 'double':
          get().addHit(currentBatter, 'double');
          break;
        case 'triple':
          get().addHit(currentBatter, 'triple');
          break;
        case 'homerun':
          get().addHit(currentBatter, 'homerun');
          break;
        case 'out':
          get().addOut();
          break;
        case 'foul':
          // ファウルの処理（2ストライク未満の場合のみストライク追加）
          const { count } = get();
          if (count.strikes < 2) {
            get().addStrike();
          }
          break;
        case 'walk':
          // 四球の処理 - 1塁に出塁
          get().setRunner(currentBatter, 'first', true);
          get().resetCount();
          break;
        case 'strikeout':
          // 三振の処理
          get().addOut();
          break;
      }
    },
    
    // === 派生状態（ゲッター） ===
    getCountDisplay: () => {
      const { count } = get();
      return `${count.balls}-${count.strikes} ${count.outs}OUT`;
    },
    
    getInningDisplay: () => {
      const { inning } = get();
      return `${inning.current}回${inning.isTop ? '表' : '裏'}`;
    },
    
    getScoreDisplay: () => {
      const { homeTeam, awayTeam } = get();
      return `HOME ${homeTeam.score} - ${awayTeam.score} AWAY`;
    },
    
    isGameOver: () => {
      const { inning, homeTeam, awayTeam } = get();
      
      // 9回裏終了、または9回表終了でホームチームがリード
      return inning.current >= 9 && (
        !inning.isTop || 
        (inning.isTop && homeTeam.score > awayTeam.score)
      );
    },
    
    getWinningTeam: () => {
      if (!get().isGameOver()) return null;
      
      const { homeTeam, awayTeam } = get();
      
      if (homeTeam.score > awayTeam.score) return 'home';
      if (awayTeam.score > homeTeam.score) return 'away';
      return 'tie';
    }
  }))
);

// === セレクター（最適化用） ===
export const useGameCount = () => useGameStore((state) => state.count);
export const useGameScore = () => useGameStore((state) => ({ 
  home: state.homeTeam, 
  away: state.awayTeam 
}));
export const useGameInning = () => useGameStore((state) => state.inning);
export const useGameStatus = () => useGameStore((state) => state.isGameActive);

// === アクションのみ取得（再レンダリング最適化） ===
export const useGameActions = () => {
  const addStrike = useGameStore((state) => state.addStrike);
  const addBall = useGameStore((state) => state.addBall);
  const addOut = useGameStore((state) => state.addOut);
  const addHit = useGameStore((state) => state.addHit);
  const addScore = useGameStore((state) => state.addScore);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const processPlayResult = useGameStore((state) => state.processPlayResult);

  return {
    addStrike,
    addBall,
    addOut,
    addHit,
    addScore,
    startGame,
    resetGame,
    processPlayResult
  };
};