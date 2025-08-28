# 野球ゲーム状態管理システム - システム図

## システムアーキテクチャ図

```mermaid
graph TB
    subgraph "3D Baseball Game System"
        A[3D Scene] --> B[Ball Physics]
        A --> C[Bat Controller]
        A --> D[Stadium Environment]
    end
    
    subgraph "UI Layer"
        E[GameStateDisplay] --> F[Score Display]
        E --> G[Inning Display] 
        E --> H[Runner Display]
        I[GameControls] --> J[Play Controls]
        I --> K[Game Control]
        L[Scoreboard] --> M[Detailed Stats]
    end
    
    subgraph "State Management Layer"
        N[GameStore<br/>Zustand] --> O[Game State]
        N --> P[Actions]
        N --> Q[Selectors]
        R[useGameStore]
        S[useGameActions]
        T[useGameCount]
        U[useGameScore]
    end
    
    subgraph "Business Logic Layer"
        V[GameRuleEngine] --> W[Hit Calculation]
        V --> X[Strike Zone]
        V --> Y[Runner Logic]
        Z[CollisionDetector] --> AA[Ball-Bat Collision]
    end
    
    subgraph "Type System"
        BB[gameState.ts] --> CC[CountState]
        BB --> DD[TeamState] 
        BB --> EE[RunnerState]
        FF[gameEvents.ts] --> GG[GameEvent]
        FF --> HH[RunnerAdvancement]
    end
    
    %% Connections
    B --> V
    C --> Z
    V --> N
    Z --> N
    N --> R
    N --> S
    N --> T
    N --> U
    R --> E
    S --> I
    T --> E
    U --> L
    BB --> N
    FF --> N
    
    %% Styling
    classDef uiLayer fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef stateLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef logicLayer fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef typeLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef gameLayer fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class E,F,G,H,I,J,K,L,M uiLayer
    class N,O,P,Q,R,S,T,U stateLayer
    class V,W,X,Y,Z,AA logicLayer
    class BB,CC,DD,EE,FF,GG,HH typeLayer
    class A,B,C,D gameLayer
```

## データフロー図

```mermaid
flowchart TD
    A[3D Ball Physics] -->|Ball Position| B{Strike Zone Check}
    C[Bat Controller] -->|Swing Data| D{Ball-Bat Collision?}
    
    B -->|Strike| E[processPlayResult('strike')]
    B -->|Ball| F[processPlayResult('ball')]
    
    D -->|Hit| G{Calculate Hit Type}
    D -->|Miss| H[processPlayResult('strike')]
    
    G -->|Power > 80| I[processPlayResult('homerun')]
    G -->|Power > 60| J[processPlayResult('triple')]
    G -->|Power > 40| K[processPlayResult('double')]
    G -->|Power <= 40| L[processPlayResult('single')]
    
    E --> M[GameStore Update]
    F --> M
    H --> M
    I --> N[Hit Processing]
    J --> N
    K --> N
    L --> N
    
    N --> O[advanceRunners()]
    O --> P[processRunnerScoring()]
    P --> Q[Update Team State]
    
    M --> R[Count Update]
    R --> S{Check Game State}
    
    S -->|3 Strikes| T[addOut()]
    S -->|4 Balls| U[Walk to 1st Base]
    S -->|3 Outs| V[nextInning()]
    
    Q --> W[UI Update]
    T --> W
    U --> W
    V --> W
    
    W --> X[GameStateDisplay]
    W --> Y[Scoreboard]
    W --> Z[Runner Display]
    
    %% Styling
    classDef physicsNode fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
    classDef logicNode fill:#dcedc8,stroke:#689f38,stroke-width:2px
    classDef stateNode fill:#e1bee7,stroke:#8e24aa,stroke-width:2px
    classDef uiNode fill:#bbdefb,stroke:#1976d2,stroke-width:2px
    
    class A,C physicsNode
    class B,D,G,O,P,S logicNode
    class E,F,H,I,J,K,L,M,N,Q,R,T,U,V stateNode
    class W,X,Y,Z uiNode
```

## 進塁システムフロー図

```mermaid
stateDiagram-v2
    [*] --> CheckHit
    
    CheckHit --> Single : single
    CheckHit --> Double : double
    CheckHit --> Triple : triple
    CheckHit --> Homerun : homerun
    
    state Single {
        [*] --> MoveBatter1
        MoveBatter1 --> MoveFirst2
        MoveFirst2 --> MoveSecond3
        MoveSecond3 --> MoveThirdHome
        MoveThirdHome --> [*]
        
        MoveBatter1 : バッター → 1塁
        MoveFirst2 : 1塁 → 2塁
        MoveSecond3 : 2塁 → 3塁
        MoveThirdHome : 3塁 → ホーム(得点)
    }
    
    state Double {
        [*] --> MoveBatter2
        MoveBatter2 --> MoveFirst3
        MoveFirst3 --> MoveSecondHome
        MoveSecondHome --> MoveThirdHome2
        MoveThirdHome2 --> [*]
        
        MoveBatter2 : バッター → 2塁
        MoveFirst3 : 1塁 → 3塁
        MoveSecondHome : 2塁 → ホーム(得点)
        MoveThirdHome2 : 3塁 → ホーム(得点)
    }
    
    state Triple {
        [*] --> MoveBatter3
        MoveBatter3 --> AllRunnersHome
        AllRunnersHome --> [*]
        
        MoveBatter3 : バッター → 3塁
        AllRunnersHome : 全ランナー → ホーム(得点)
    }
    
    state Homerun {
        [*] --> AllHome
        AllHome : 全員 → ホーム(得点)
        AllHome --> [*]
    }
    
    Single --> CalculateScore
    Double --> CalculateScore
    Triple --> CalculateScore
    Homerun --> CalculateScore
    
    CalculateScore --> UpdateRunners
    UpdateRunners --> UpdateUI
    UpdateUI --> [*]
```

## ゲーム状態遷移図

```mermaid
stateDiagram-v2
    [*] --> GameInitialized
    
    GameInitialized --> GameStarted : startGame()
    GameStarted --> Pitching : First Batter
    
    state Pitching {
        [*] --> WaitingForPitch
        WaitingForPitch --> BallInPlay : Ball Pitched
        BallInPlay --> Strike : Strike Zone Hit
        BallInPlay --> Ball : Outside Zone
        BallInPlay --> Hit : Bat Contact
        BallInPlay --> Foul : Foul Ball
        
        Strike --> CheckStrikeout
        Ball --> CheckWalk
        Foul --> CheckFoulStrike
        Hit --> ProcessHit
        
        CheckStrikeout --> Out : 3 Strikes
        CheckStrikeout --> WaitingForPitch : Continue
        
        CheckWalk --> Walk : 4 Balls
        CheckWalk --> WaitingForPitch : Continue
        
        CheckFoulStrike --> Out : 3rd Strike Foul
        CheckFoulStrike --> WaitingForPitch : Continue
        
        Walk --> NewBatter
        Out --> CheckInning
        ProcessHit --> NewBatter
    }
    
    NewBatter --> Pitching : Next Batter
    
    CheckInning --> NewInning : 3 Outs
    CheckInning --> Pitching : Continue
    
    NewInning --> CheckGameEnd
    CheckGameEnd --> GameOver : 9+ Innings Complete
    CheckGameEnd --> Pitching : Continue Game
    
    state GameOver {
        [*] --> DetermineWinner
        DetermineWinner --> HomeWins : Home > Away
        DetermineWinner --> AwayWins : Away > Home  
        DetermineWinner --> ExtraInnings : Tie Game
        
        ExtraInnings --> Pitching : Continue
    }
    
    GameOver --> [*] : resetGame()
    GameStarted --> GameInitialized : resetGame()
```

## ランナー状態図

```mermaid
graph TB
    subgraph "ベース状況"
        A[ホームプレート<br/>バッター待機] --> B{1塁}
        B --> C{2塁}
        C --> D{3塁}
        D --> E[ホームイン<br/>得点]
    end
    
    subgraph "進塁パターン: 単打"
        F[バッター] -->|単打| G[1塁占拠]
        H[1塁ランナー] -->|単打| I[2塁進塁]
        J[2塁ランナー] -->|単打| K[3塁進塁]
        L[3塁ランナー] -->|単打| M[得点]
    end
    
    subgraph "進塁パターン: 二塁打"
        N[バッター] -->|二塁打| O[2塁占拠]
        P[1塁ランナー] -->|二塁打| Q[3塁進塁]
        R[2塁ランナー] -->|二塁打| S[得点]
        T[3塁ランナー] -->|二塁打| U[得点]
    end
    
    subgraph "進塁パターン: 三塁打"
        V[バッター] -->|三塁打| W[3塁占拠]
        X[全ランナー] -->|三塁打| Y[得点]
    end
    
    subgraph "進塁パターン: ホームラン"
        Z[全員] -->|ホームラン| AA[得点]
    end
    
    %% Base states
    B -->|空| BB[Empty]
    B -->|占拠| BC[Runner on 1st]
    C -->|空| CB[Empty]
    C -->|占拠| CC[Runner on 2nd]
    D -->|空| DB[Empty]
    D -->|占拠| DC[Runner on 3rd]
    
    %% Styling
    classDef baseNode fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef singleNode fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef doubleNode fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef tripleNode fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef homerunNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    
    class A,B,C,D,E,BB,BC,CB,CC,DB,DC baseNode
    class F,G,H,I,J,K,L,M singleNode
    class N,O,P,Q,R,S,T,U doubleNode
    class V,W,X,Y tripleNode
    class Z,AA homerunNode
```

## UI コンポーネント構成図

```mermaid
graph TB
    subgraph "Main Game UI"
        A[App.tsx]
        A --> B[GamePage]
    end
    
    subgraph "3D Scene Layer"
        B --> C[Canvas/Scene]
        C --> D[BaseballStadium]
        C --> E[BattingMachine]
        C --> F[BatController]
        C --> G[Ball Physics]
    end
    
    subgraph "Game UI Layer"
        B --> H[GameStateDisplay]
        B --> I[GameControls]
        B --> J[Scoreboard]
    end
    
    subgraph "GameStateDisplay Components"
        H --> K[Score Display<br/>HOME 0 - 0 AWAY]
        H --> L[Inning Display<br/>1回表]
        H --> M[Count Display<br/>0-0 0OUT]
        H --> N[Runner Display]
        
        N --> O[1塁状態]
        N --> P[2塁状態]
        N --> Q[3塁状態]
    end
    
    subgraph "GameControls Components"
        I --> R[Game Control Panel]
        I --> S[Play Result Controls]
        
        R --> T[Start Game]
        R --> U[Reset Game]
        R --> V[End Game]
        
        S --> W[Strike/Ball]
        S --> X[Hit Types]
        S --> Y[Out/Walk]
        
        X --> Z[Single]
        X --> AA[Double]
        X --> BB[Triple]
        X --> CC[Homerun]
    end
    
    subgraph "Scoreboard Components"
        J --> DD[Team Stats]
        J --> EE[Game Status]
        J --> FF[Detailed Stats]
        
        DD --> GG[HOME Team]
        DD --> HH[AWAY Team]
        
        GG --> II[Score/Hits/Errors]
        HH --> JJ[Score/Hits/Errors]
    end
    
    subgraph "State Connections"
        KK[useGameStore]
        LL[useGameActions]
        MM[useGameCount]
        NN[useGameScore]
    end
    
    %% State connections
    H -.->|subscribe| KK
    H -.->|subscribe| MM
    H -.->|subscribe| NN
    I -.->|actions| LL
    J -.->|subscribe| NN
    
    E -.->|physics events| LL
    F -.->|collision events| LL
    
    %% Styling
    classDef mainNode fill:#ffebee,stroke:#d32f2f,stroke-width:3px
    classDef sceneNode fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef uiNode fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef stateNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef displayNode fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class A,B mainNode
    class C,D,E,F,G sceneNode
    class H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE,FF,GG,HH,II,JJ uiNode
    class KK,LL,MM,NN stateNode
```

## データベース/状態構造図

```mermaid
erDiagram
    GameState {
        CountState count
        TeamState homeTeam
        TeamState awayTeam
        InningState inning
        boolean isGameActive
        string currentBatter
    }
    
    CountState {
        number strikes "0-2"
        number balls "0-3"
        number outs "0-2"
    }
    
    TeamState {
        number score
        number hits
        number errors
        RunnerState runners
    }
    
    RunnerState {
        boolean first
        boolean second
        boolean third
    }
    
    InningState {
        number current "1-9+"
        boolean isTop "true=表, false=裏"
    }
    
    GameEvent {
        PlayResult type
        number timestamp
        string description
        CountState countBefore
        CountState countAfter
        object metadata
        array relatedEvents
    }
    
    RunnerAdvancement {
        string from "batter|first|second|third"
        string to "first|second|third|home"
        boolean scored
    }
    
    %% Relationships
    GameState ||--|| CountState : contains
    GameState ||--|| TeamState : "homeTeam"
    GameState ||--|| TeamState : "awayTeam"
    GameState ||--|| InningState : contains
    TeamState ||--|| RunnerState : contains
    GameEvent ||--|| CountState : "countBefore"
    GameEvent ||--|| CountState : "countAfter"
```

## シーケンス図: ヒット処理

```mermaid
sequenceDiagram
    participant User as プレイヤー
    participant UI as GameControls
    participant Store as GameStore
    participant Logic as AdvanceRunners
    participant Display as GameStateDisplay
    
    User->>UI: 出塁判定
    UI->>Store: processPlayResult('double')
    
    Store->>Store: 現在のバッターチーム取得
    Store->>Logic: advanceRunners(team, 'double')
    
    Logic->>Logic: バッター → 2塁
    Logic->>Logic: 1塁ランナー → 3塁
    Logic->>Logic: 2塁ランナー → ホーム(得点)
    Logic->>Logic: 3塁ランナー → ホーム(得点)
    Logic-->>Store: RunnerAdvancement[]
    
    Store->>Store: processRunnerScoring()
    Store->>Store: 得点計算 (2点追加)
    Store->>Store: ランナー状態更新
    Store->>Store: ヒット数+1
    Store->>Store: カウントリセット
    
    Store-->>Display: 状態更新通知
    Display->>Display: スコア更新表示
    Display->>Display: ランナー状況更新
    Display->>Display: カウント表示更新
    
    Display-->>User: 画面更新完了
```

## 実装フェーズ図

```mermaid
gantt
    title 野球ゲーム状態管理システム実装フェーズ
    dateFormat  YYYY-MM-DD
    section Phase 1: 基本実装
    型定義作成           :done,    phase1-1, 2024-01-01, 1d
    Zustandストア        :done,    phase1-2, after phase1-1, 2d
    基本UIコンポーネント    :done,    phase1-3, after phase1-2, 1d
    
    section Phase 2: ルールエンジン
    GameRuleEngine実装    :active,  phase2-1, 2024-01-05, 3d
    衝突判定システム       :         phase2-2, after phase2-1, 2d
    ゲーム制御UI          :         phase2-3, after phase2-2, 2d
    
    section Phase 3: 3D統合
    BattingMachine統合    :         phase3-1, after phase2-3, 2d
    BatController統合     :         phase3-2, after phase3-1, 2d
    物理演算連携          :         phase3-3, after phase3-2, 2d
    
    section Phase 4: UI強化
    スコアボード実装       :         phase4-1, after phase3-3, 2d
    詳細統計システム       :         phase4-2, after phase4-1, 2d
    デバッグツール        :         phase4-3, after phase4-2, 1d
    
    section Phase 5: 拡張機能
    犠牲フライ・盗塁       :         phase5-1, after phase4-3, 3d
    リプレイシステム       :         phase5-2, after phase5-1, 3d
    セーブ・ロード機能     :         phase5-3, after phase5-2, 2d
```

## エラーハンドリングフロー

```mermaid
flowchart TD
    A[User Action] --> B{Valid Action?}
    
    B -->|No| C[Show Error Message]
    B -->|Yes| D[Process Action]
    
    D --> E{State Validation}
    E -->|Invalid| F[Rollback State]
    E -->|Valid| G[Update State]
    
    F --> H[Log Error]
    G --> I[Notify Subscribers]
    
    H --> J[Show User Feedback]
    I --> K[Update UI]
    
    C --> L[Log User Error]
    J --> M[Continue Game]
    K --> N[Game Continues]
    L --> O[User Retries]
    
    M --> P[Ready for Next Action]
    N --> P
    O --> A
    
    %% Error Recovery
    G --> Q{Critical Error?}
    Q -->|Yes| R[Emergency Reset]
    Q -->|No| I
    
    R --> S[Save Error Report]
    S --> T[Reset to Safe State]
    T --> U[Notify User of Reset]
    U --> P
    
    %% Styling
    classDef errorNode fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
    classDef successNode fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    classDef processNode fill:#e1bee7,stroke:#7b1fa2,stroke-width:2px
    
    class C,F,H,J,L,R,S,U errorNode
    class G,I,K,N,P successNode
    class A,B,D,E,Q,T processNode
```

これらのMermaid図により、野球ゲーム状態管理システムの全体像を視覚的に理解できます！