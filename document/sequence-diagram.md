```mermaid
sequenceDiagram
    participant d as DB
    participant b as backend
    participant f1 as frontend1
    participant f2 as frontend2

    Note over f1,f2: ルーム一覧ページ
    f1->>f1: アクセス
    f1->>+b: ルーム一覧取得<br>GET /rooms
    b->>b: 古いroom削除
    b->>+d: FROM rooms WHERE turn_user_id = null
    d-->>-b: room[]
    b-->>-f1: room[]
    f1->>+b: ルーム作成<br/>POST /rooms
    b->>+d: INSERT rooms
    d-->>-b: room
    b-->>-f1: room
    f1->>f1: ルームに参加(ページ遷移)

    Note over f1,f2: ゲーム画面(開始前)
    rect rgb(240, 250, 255)
    note right of d: ルーム参加(ユーザ作成)
    f1->>+b: ルームの状態確認<br/>GET /rooms/{room_id}
    b->>+d: FROM rooms WHERE id = room_id
    d-->>-b: room
    b-->>-f1: room
    alt room.turn_user_id !== null
        f1->>f1: ルーム一覧ページに遷移
    end
    f1->>b: WS /rooms/{room_id}
    f1->>f1: 名前を入力(またはlocalStorageから取得)
    f1->>+b: ユーザ作成(ルーム参加)<br/>POST /users<br/>{ name, roomId }
    b->>+d: INSERT users
    d-->>-b: user
    b-->>f1: user
    b->>-f1: WS room(リレーション含む)
    end
    f2->>f2: アクセス
    f2->>f2: ルーム参加(ユーザ作成)
    f1->>+b: ゲームスタート<br/>PUT /rooms/{roomId}
    b->>b: turn_user_idをランダムに設定
    b->>b: 参加ユーザのカードリセット、お金を配る
    b->>+d: SET rooms.turn_user_id
    d->>-b: room
    b->>f1: WS room(リレーション含む)
    b->>-f2: WS room(リレーション含む)

    Note over f1,f2: ゲーム画面(ゲーム中)
    alt ゲーム終了判定 === true
        f1->>f1: 点数計算、勝者表示
        f2->>f2: 点数計算、勝者表示
        alt 再戦
            f1->>b: ゲームスタート<br/>PUT /rooms/{room_id}
        end
    end
    f1->>f1: 自分のターン(room.turn_user_id)
    f1->>f1: 競売か取引を選択
    alt 競売
        f1->>+b: 山札のカードを引く<br/>POST /auctions
        b->>d: INSERT auctions
        b->>d: SET rooms.auction_id
        b->>+d: 山札からランダムに動物カードを1枚取得
        d-->>-b: card
        b->>d: SET auctions.animel_card_id
        b->>b: ロバならお金を配る
        b-->>f1: WS room(リレーション含む)
        b-->>-f2: WS room(リレーション含む)
        f2->>+b: 入札<br/>PUT /auctions/{auction_id}
        b->>d: SET auctions.top_user_id, amount
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f1->>+b: オークション確定<br/>DELETE /auctions/{auction_id}
        b->>d: SET auctions.isConfirmed = true
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f2->>+b: 支払い<br/>DELETE /auctions/{auction_id}
        b->>b: 動物カード付与、お金カード交換
        b->>b: room.turn_user_id更新
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f1->>f1: 次のターン
        f2->>f2: 次のターン
    else 取引
        f1->>f1: 取引対象を選択
        f1->>+b: 取引を開始<br/>POST /trades
        b->>d: INSERT trades
        b->>d: SET rooms.trade_id
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f1->>+b: 金額カード指定<br/>PUT /trade/{trade_id}
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f2->>+b: 金額カード指定<br/>PUT /trade/{trade_id}
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f1->>+b: 金額カード確定<br/>DELETE /trade/{trade_id}
        b->>d: SET trades.is_confirmed
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f2->>+b: 金額カード確定<br/>DELETE /trade/{trade_id}
        b->>b: trades.is_confirmed === trueならトレード処理
        b->>b: room.turn_user_id更新
        b->>f1: WS room(リレーション含む)
        b->>-f2: WS room(リレーション含む)
        f1->>f1: 次のターン
        f2->>f2: 次のターン
    end
```
