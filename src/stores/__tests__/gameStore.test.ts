import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'
import { act } from '@testing-library/react'

describe('GameStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    act(() => {
      useGameStore.getState().resetGame()
    })
  })

  describe('初期状態', () => {
    it('正しい初期値を持つ', () => {
      const state = useGameStore.getState()
      
      expect(state.count).toEqual({ strikes: 0, balls: 0, outs: 0 })
      expect(state.homeTeam).toEqual({
        score: 0,
        hits: 0,
        errors: 0,
        runners: { first: false, second: false, third: false }
      })
      expect(state.awayTeam).toEqual({
        score: 0,
        hits: 0,
        errors: 0,
        runners: { first: false, second: false, third: false }
      })
      expect(state.inning).toEqual({ current: 1, isTop: true })
      expect(state.isGameActive).toBe(false)
      expect(state.currentBatter).toBe('away')
    })
  })

  describe('カウント操作', () => {
    it('ストライクを追加できる', () => {
      const { addStrike } = useGameStore.getState()
      
      act(() => addStrike())
      
      expect(useGameStore.getState().count.strikes).toBe(1)
    })

    it('ボールを追加できる', () => {
      const { addBall } = useGameStore.getState()
      
      act(() => addBall())
      
      expect(useGameStore.getState().count.balls).toBe(1)
    })

    it('3ストライクでアウトになる', () => {
      const { addStrike } = useGameStore.getState()
      
      act(() => {
        addStrike() // 1ストライク
        addStrike() // 2ストライク
        addStrike() // 3ストライク→アウト
      })
      
      const state = useGameStore.getState()
      expect(state.count.strikes).toBe(0) // リセットされる
      expect(state.count.outs).toBe(1) // アウトカウント増加
    })

    it('4ボールで出塁する', () => {
      const { addBall } = useGameStore.getState()
      
      act(() => {
        addBall() // 1ボール
        addBall() // 2ボール
        addBall() // 3ボール
        addBall() // 4ボール→出塁
      })
      
      const state = useGameStore.getState()
      expect(state.count.balls).toBe(0) // リセットされる
      expect(state.count.strikes).toBe(0) // リセットされる
    })

    it('3アウトでイニングが進む', () => {
      const { addOut } = useGameStore.getState()
      
      act(() => {
        addOut() // 1アウト
        addOut() // 2アウト
        addOut() // 3アウト→イニング進行
      })
      
      const state = useGameStore.getState()
      expect(state.count.outs).toBe(0) // リセットされる
      expect(state.inning.isTop).toBe(false) // 表→裏
      expect(state.currentBatter).toBe('home') // バッターチーム変更
    })
  })

  describe('スコア操作', () => {
    it('ホームチームのスコアを追加できる', () => {
      const { addScore } = useGameStore.getState()
      
      act(() => addScore('home', 2))
      
      expect(useGameStore.getState().homeTeam.score).toBe(2)
    })

    it('アウェイチームのスコアを追加できる', () => {
      const { addScore } = useGameStore.getState()
      
      act(() => addScore('away', 3))
      
      expect(useGameStore.getState().awayTeam.score).toBe(3)
    })
  })

  describe('ランナー操作', () => {
    it('ランナーを設定できる', () => {
      const { setRunner } = useGameStore.getState()
      
      act(() => setRunner('away', 'first', true))
      
      expect(useGameStore.getState().awayTeam.runners.first).toBe(true)
    })

    it('ランナーをクリアできる', () => {
      const { setRunner, clearRunners } = useGameStore.getState()
      
      act(() => {
        setRunner('away', 'first', true)
        setRunner('away', 'second', true)
        clearRunners('away')
      })
      
      const runners = useGameStore.getState().awayTeam.runners
      expect(runners.first).toBe(false)
      expect(runners.second).toBe(false)
      expect(runners.third).toBe(false)
    })
  })

  describe('ヒット処理', () => {
    it('単打でバッターが1塁に出塁する', () => {
      const { addHit } = useGameStore.getState()
      
      act(() => addHit('away', 'single'))
      
      const state = useGameStore.getState()
      expect(state.awayTeam.hits).toBe(1)
      expect(state.awayTeam.runners.first).toBe(true)
      expect(state.count.strikes).toBe(0) // カウントリセット
      expect(state.count.balls).toBe(0)
    })

    it('ホームランで得点が入る', () => {
      const { addHit } = useGameStore.getState()
      
      act(() => addHit('away', 'homerun'))
      
      const state = useGameStore.getState()
      expect(state.awayTeam.hits).toBe(1)
      expect(state.awayTeam.score).toBe(1) // 得点
      expect(state.awayTeam.runners.first).toBe(false) // ランナーなし
    })

    it('ランナーありの単打で進塁・得点する', () => {
      const { setRunner, addHit } = useGameStore.getState()
      
      act(() => {
        // 3塁にランナーを配置
        setRunner('away', 'third', true)
        // 単打
        addHit('away', 'single')
      })
      
      const state = useGameStore.getState()
      expect(state.awayTeam.score).toBe(1) // 3塁ランナーが得点
      expect(state.awayTeam.runners.first).toBe(true) // バッターが1塁
      expect(state.awayTeam.runners.third).toBe(false) // 3塁は空
    })
  })

  describe('イニング操作', () => {
    it('nextInningで表→裏に進む', () => {
      const { nextInning } = useGameStore.getState()
      
      act(() => nextInning())
      
      const state = useGameStore.getState()
      expect(state.inning.isTop).toBe(false)
      expect(state.currentBatter).toBe('home')
      expect(state.count).toEqual({ strikes: 0, balls: 0, outs: 0 })
    })

    it('nextInningで裏→次イニング表に進む', () => {
      const { setInning, nextInning } = useGameStore.getState()
      
      act(() => {
        setInning(1, false) // 1回裏に設定
        nextInning()
      })
      
      const state = useGameStore.getState()
      expect(state.inning.current).toBe(2)
      expect(state.inning.isTop).toBe(true)
      expect(state.currentBatter).toBe('away')
    })
  })

  describe('プレイ結果処理', () => {
    it('processPlayResult でストライクを処理する', () => {
      const { processPlayResult } = useGameStore.getState()
      
      act(() => processPlayResult('strike'))
      
      expect(useGameStore.getState().count.strikes).toBe(1)
    })

    it('processPlayResult でボールを処理する', () => {
      const { processPlayResult } = useGameStore.getState()
      
      act(() => processPlayResult('ball'))
      
      expect(useGameStore.getState().count.balls).toBe(1)
    })

    it('processPlayResult で単打を処理する', () => {
      const { processPlayResult } = useGameStore.getState()
      
      act(() => processPlayResult('single'))
      
      const state = useGameStore.getState()
      expect(state.awayTeam.hits).toBe(1)
      expect(state.awayTeam.runners.first).toBe(true)
    })

    it('processPlayResult でファウルを処理する', () => {
      const { processPlayResult } = useGameStore.getState()
      
      // 2ストライク未満の場合はストライク追加
      act(() => processPlayResult('foul'))
      expect(useGameStore.getState().count.strikes).toBe(1)
      
      // 2ストライクの場合はストライク数変わらず
      act(() => {
        useGameStore.getState().addStrike() // 2ストライクにする
        processPlayResult('foul')
      })
      expect(useGameStore.getState().count.strikes).toBe(2)
    })
  })

  describe('ゲーム制御', () => {
    it('startGameでゲームが開始される', () => {
      const { startGame } = useGameStore.getState()
      
      act(() => startGame())
      
      expect(useGameStore.getState().isGameActive).toBe(true)
    })

    it('resetGameで初期状態に戻る', () => {
      const { addScore, addStrike, startGame, resetGame } = useGameStore.getState()
      
      act(() => {
        startGame()
        addScore('home', 5)
        addStrike()
        resetGame()
      })
      
      const state = useGameStore.getState()
      expect(state.isGameActive).toBe(false)
      expect(state.homeTeam.score).toBe(0)
      expect(state.count.strikes).toBe(0)
    })

    it('endGameでゲームが終了する', () => {
      const { startGame, endGame } = useGameStore.getState()
      
      act(() => {
        startGame()
        endGame()
      })
      
      expect(useGameStore.getState().isGameActive).toBe(false)
    })
  })

  describe('派生状態', () => {
    it('getCountDisplayで正しい表示を取得', () => {
      const { addStrike, addBall } = useGameStore.getState()
      
      act(() => {
        addStrike() // 1ストライク
        addBall()   // 1ボール
      })
      
      // アウトカウントは手動で設定（addOut()はカウントリセットするため）
      useGameStore.setState(state => ({
        count: { ...state.count, outs: 1 }
      }))
      
      const display = useGameStore.getState().getCountDisplay()
      expect(display).toBe('1-1 1OUT')
    })

    it('getInningDisplayで正しい表示を取得', () => {
      const { setInning } = useGameStore.getState()
      
      act(() => setInning(5, false))
      
      const display = useGameStore.getState().getInningDisplay()
      expect(display).toBe('5回裏')
    })

    it('getScoreDisplayで正しい表示を取得', () => {
      const { addScore } = useGameStore.getState()
      
      act(() => {
        addScore('home', 3)
        addScore('away', 7)
      })
      
      const display = useGameStore.getState().getScoreDisplay()
      expect(display).toBe('HOME 3 - 7 AWAY')
    })

    it('isGameOverで9回終了を判定', () => {
      const { setInning } = useGameStore.getState()
      
      // 9回表
      act(() => setInning(9, true))
      expect(useGameStore.getState().isGameOver()).toBe(false)
      
      // 9回裏
      act(() => setInning(9, false))
      expect(useGameStore.getState().isGameOver()).toBe(true)
    })

    it('getWinningTeamで勝利チームを判定', () => {
      const { setInning, addScore } = useGameStore.getState()
      
      act(() => {
        setInning(9, false) // ゲーム終了状態
        addScore('home', 5)
        addScore('away', 3)
      })
      
      const winner = useGameStore.getState().getWinningTeam()
      expect(winner).toBe('home')
    })
  })
})