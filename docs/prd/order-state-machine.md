# 受注状態機械 PRD v1

**作成日:** 2026-05-07
**ステータス:** 確定（実装着手可）
**スコープ:** 機能間連動フェーズの第1段。受注ドメインの状態機械を定義し、入金・引当・印刷・出荷との連鎖の基盤を作る。

---

## 1. 背景

OMSの基本ページ群（受注・出荷・入金・在庫・発注）は完成済み。次フェーズは「機能同士がどう連動するか」の実装。受注の状態が連動の起点になるため、まず受注状態機械を `src/lib/state-machines/order.ts` に集約し、ページから直接 status を書き換える設計を撲滅する。

参考資料 `reference/screenshot/受注伝票管理_*クリック.png` のタブ群を正規ステータスとする。

---

## 2. 状態セット（9状態）

| # | 状態 | 説明 |
|---|------|------|
| 1 | 新規受付 | 受注取得APIで取り込まれた直後の初期状態 |
| 2 | 確認待ち | 内容確認待ち（バリデーション通過後） |
| 3 | 発売日時待ち | 予約販売／予約受注で発売日時刻まで保留 |
| 4 | 入金待ち | 確認完了。入金確認待ちの状態 |
| 5 | 引当待ち | 入金確認済。在庫引当待ち or 在庫不足エラー |
| 6 | 印刷待ち | 引当成功。納品書／送り状の印刷待ち |
| 7 | 印刷済み | 印刷完了。出荷登録待ち |
| 8 | 出荷済み | 出荷完了 |
| 9 | キャンセル | 印刷済みまでの状態から手動キャンセル |

---

## 3. 遷移マトリクス

| from | to | 種別 | 条件・トリガー |
|------|-----|------|----------------|
| 新規受付 | 確認待ち | auto | 受注取得APIのバリデーション通過時 |
| 新規受付 / 確認待ち | 発売日時待ち | auto | 受注に発売日フラグが立っている商品が含まれる時 |
| 発売日時待ち | 確認待ち | scheduled | 発売日時刻到達時（cron / scheduled job） |
| 確認待ち | 入金待ち | auto | 確認処理完了時（前払いの場合） |
| 入金待ち | 引当待ち | **manual** | 入金確認ボタン押下時 |
| 引当待ち | 印刷待ち | auto | 在庫引当成功時 |
| 引当待ち | 引当待ち（errorBadge） | auto | 在庫不足時。状態は変えずエラーバッジを立てる |
| 引当待ち（errorBadge） | 引当待ち（再試行）→ 印刷待ち | manual | 入荷後に再引当ボタン押下時 |
| 印刷待ち | 印刷済み | manual | 印刷完了登録時 |
| 印刷済み | 出荷済み | manual | 出荷登録時 |
| 新規受付 〜 印刷済み | キャンセル | manual | キャンセルボタン押下時 |
| 出荷済み | （別フロー：返品処理） | — | state machine 外。`src/app/shipments/return/` 等で別途実装 |

### 自動化の境界

**人手が介入するのは2点のみ:**
1. 入金確認（入金待ち → 引当待ち）
2. 出荷登録（印刷済み → 出荷済み）

これに加えて、印刷（印刷待ち → 印刷済み）は人手だが業務フロー上印刷物を出すアクションそのもの。在庫引当と印刷キュー追加は完全自動。

---

## 4. 連動先ドメイン

| 受注の遷移 | 連動アクション | 実装場所 |
|------------|--------------|---------|
| 入金待ち → 引当待ち | `allocateInventory(orderId)` を呼ぶ | `src/lib/events/inventory-handlers.ts` |
| 引当成功 → 印刷待ち | `enqueuePrintJob(orderId)` を呼ぶ | `src/lib/events/print-handlers.ts` |
| 印刷済み → 出荷済み | `recordShipment(orderId)` を呼び在庫を実減 | `src/lib/events/inventory-handlers.ts` |
| キャンセル | 引当済なら `releaseInventory(orderId)` で戻す | `src/lib/events/inventory-handlers.ts` |

連動はドメインイベント駆動。受注ページから直接 `inventory.allocate()` を呼ばない。

---

## 5. 冪等性

全遷移関数は guard 条件で `現在status === 期待from` を検査する。
- 一致しない場合は no-op で現状の `Order` を返す（throw しない）
- 一致する場合のみ新しい `Order` オブジェクトを返す（イミュータブル更新）

二重発火・リトライ・遅延配信があっても安全。

---

## 6. ファイル構成

```
src/lib/state-machines/
  order.ts              # OrderStatus, transitionOrder(), isCancellable(), guards
  (order.test.ts)       # 今回はスキップ。後日テストランナー導入後に追加

src/lib/events/
  order-events.ts       # OrderConfirmed, PaymentConfirmed, ShipmentRegistered, OrderCancelled
  inventory-handlers.ts # 在庫引当・解放ハンドラ
  print-handlers.ts     # 印刷キュー追加ハンドラ

src/lib/calculations/
  release-date.ts       # 発売日時待ち判定（時刻比較）
```

---

## 7. 既存ページへの影響

### `src/app/orders/page.tsx`
- `OrderStatus` 型を6状態 → 9状態に拡張
- `statusBadge` マップを9状態分に更新
- タブ配列を6タブ → 9タブに拡張（参考資料の `受注伝票管理_*クリック.png` に揃える）
- 初期サンプルデータも9状態を網羅するように再構成

### `src/app/orders/[id]/edit/page.tsx`
- 状態変更UIで `transitionOrder()` を経由するように後日リファクタ（今回はスコープ外）

### `src/components/sidebar.tsx`
- 影響なし（タブ表示はページ内のみ）

---

## 8. スコープと残作業

### 今回のスコープ
- [x] PRD作成（このドキュメント）
- [ ] `src/lib/state-machines/order.ts` 実装
- [ ] `src/app/orders/page.tsx` を9状態に拡張

### 別PRDで扱う
- イベントハンドラ実装（`src/lib/events/*`）
- 出荷・入金ドメインの状態機械
- 在庫の引当ドメインモデル
- 受注編集ページの状態変更UIリファクタ
- テストランナー（vitest）導入とTDD化
- 返品処理フロー

---

## 9. 受け入れ基準

1. `src/lib/state-machines/order.ts` が存在し、9状態すべてを `OrderStatus` 型で表現している
2. `transitionOrder(order, action)` が遷移マトリクス通りに動作する
3. ガード違反時に no-op で同じ Order を返す（throw しない）
4. `isCancellable(status)` が「印刷済みまで true / 出荷済みは false」を返す
5. `src/app/orders/page.tsx` のタブが9状態すべて表示される
6. `npm run build` と `npm run lint` がエラーなく通る
