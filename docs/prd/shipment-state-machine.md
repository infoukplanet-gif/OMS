# 出荷状態機械 v1 仕様書

> 機能間連動フェーズ・第2段。
> 関連: [`order-state-machine.md`](./order-state-machine.md)

## 1. 概要

OMS における **出荷伝票（Shipment）** の状態遷移ロジックを `src/lib/state-machines/shipment.ts` に集約する。

- Shipment は Order と独立した別エンティティ。
- v1 は **1 Order : 1 Shipment** で運用するが、Shipment 側は将来の分納に備えて `orderIds: string[]` を最初から配列で保持する（要素数1で固定）。
- 状態機械は発火元中立に作る。手動操作・CSV取込・将来のWMS API連携など、呼び出し側がアクションを叩く責務を持つ。

## 2. 8 状態

参考資料: 倉庫オペレーションのワークフロー（`reference/screenshot/出荷確定処理.png` / `バーコード検品出荷処理.png` / `出荷通知一括登録.png`）から抽出。

| # | 状態 | 説明 |
|---|------|------|
| 1 | `出荷指示作成` | Order が「引当待ち」に到達した時点で自動生成される初期状態 |
| 2 | `ピッキング待ち` | 倉庫がピッキング作業に着手するのを待っている |
| 3 | `検品待ち` | ピッキング完了。検品（バーコードスキャン）を待つ |
| 4 | `出荷待ち` | 検品完了。出荷確定処理（伝票番号入力）を待つ |
| 5 | `出荷済み` | 倉庫から出庫済み。Order 側に `registerShipment` を発火させる |
| 6 | `配送中` | 配送業者集荷済み |
| 7 | `配達完了` | 顧客への配達確認済み |
| 8 | `キャンセル` | 出荷済み到達前に取消された |

**Why 8状態:** 既存UIの4状態（出荷待ち/出荷済み/配送中/配達完了）はピッキング・検品工程を抽象化しすぎていて、参考資料の「バーコード検品出荷処理」「出荷確定処理」が状態遷移として現れない。倉庫オペレーションの粒度に揃えることで、これらの画面が状態機械のフックとして自然に位置づけられる。

## 3. アクション一覧（遷移パス）

| アクション | 種別 | 期待 from | to | 備考 |
|-----------|------|-----------|----|----|
| `startPicking` | auto / scheduled | 出荷指示作成 | ピッキング待ち | 倉庫オープン時刻 or 手動キュー投入 |
| `completePicking` | manual | ピッキング待ち | 検品待ち | 倉庫スタッフ操作 |
| `passInspection` | manual | 検品待ち | 出荷待ち | バーコード検品処理画面 |
| `failInspection` | manual | 検品待ち | ピッキング待ち | 検品NGで再ピッキング |
| `confirmShipment` | manual | 出荷待ち | 出荷済み | 出荷確定処理画面（伝票番号入力） |
| `markInTransit` | external | 出荷済み | 配送中 | 配送業者集荷スキャン or 日次CSV取込 |
| `markDelivered` | external | 配送中 | 配達完了 | 配送業者APIまたはCSV取込 |
| `cancel` | manual | 出荷済み到達前 | キャンセル | 在庫戻し連動あり |

## 4. 自動化境界

**手動アクション（人間の操作が必要）:**
- `completePicking`（ピッキング作業完了）
- `passInspection` / `failInspection`（検品の合否）
- `confirmShipment`（伝票番号入力）

**自動アクション:**
- `startPicking`（倉庫キューへの投入は受注確定の連鎖から自動）

**外部イベント（OMSの外で確定する状態）:**
- `markInTransit`、`markDelivered` は配送業者API or CSV取込からの**取り込み**として状態機械に流す。OMS内で人間が押すボタンを v1 ではフォールバックとして用意する（小規模事業者向け）。

**Why:** 倉庫工程は人手の作業が本体。検品・出荷確定を自動化するとピッキング誤りが現場で止まらない。一方、配送中/配達完了はOMSが知る術がないので外部入力で取り込むしかない。

## 5. キャンセル境界

- **出荷済み到達前**: `cancel` で「キャンセル」状態へ遷移。在庫戻し（`events/inventory-handlers` の `releaseAllocation`）を連動発火。
- **出荷済み以降**: キャンセル不可。返品処理（別フロー）に回す。

**Why:** 出荷済み = 物品が物理的に倉庫を出た。キャンセルしても物品の追跡が宙に浮く。実務上は返品でしか戻せない（Order 側の方針と整合）。

## 6. 冪等性

全遷移関数は guard 違反時 no-op で**元のオブジェクトをそのまま返す**（参照同一性保持・throw しない）。Order 状態機械と同じ規約。

二重発火・リトライ・CSV重複取り込みのいずれでも safe。

## 7. Order との連動

### 7.1 Order → Shipment

| Order の遷移 | Shipment への作用 |
|-----|-----|
| 引当待ち到達 | Shipment を「出荷指示作成」状態で**自動生成**（events/order-handlers） |
| 印刷済み到達 | Shipment 側の状態は変えない（印刷工程はOrder側の出力責務） |

### 7.2 Shipment → Order

| Shipment の遷移 | Order への作用 |
|-----|-----|
| 出荷済み到達 | Order に `registerShipment` を自動発火（印刷済み → 出荷済み） |
| キャンセル到達 | Order が印刷済み未満なら Order 側もキャンセルへ自動連鎖、印刷済みならエラー（手動対応） |

**疎結合の維持:** ページ層（`src/app/orders/*`, `src/app/shipments/*`）は **直接相手ドメインの状態を書き換えない**。`src/lib/events/` 配下のハンドラを必ず経由する。

## 8. 失敗時のロールバック

### 8.1 Shipment 自動生成の失敗
Order 引当待ち到達時に Shipment を生成しようとして失敗（DB制約違反等）：
- Order の状態は変えない（引当待ちのまま残す）
- エラーバッジを Order に立てる（`Order.shipmentCreationFailed: true`）
- 運用画面から手動で再生成できるボタンを用意（Order 編集ページに追加予定）

### 8.2 Shipment 出荷済み → Order registerShipment 失敗
Shipment 側は出荷済みのまま、Order 側は印刷済みのまま不整合化する：
- 整合チェックを `events/integrity-checks.ts` に置き、日次バッチで検出
- 検出されたケースは管理画面のアラートで提示

### 8.3 キャンセル連鎖の失敗
Shipment キャンセル → Order キャンセル → 在庫戻しの連鎖の途中で失敗：
- 各ステップは冪等なので、再実行で完遂できる
- ジョブキューでリトライ（`events/cancel-cascade.ts`）

## 9. 手動オーバーライド

運用上「自動連鎖を止めたい・巻き戻したい」場面のために、以下の管理者操作を用意する（v1.1 以降で実装、v1 ではコメントアウトで設計のみ示す）：

- **強制状態セット**: 任意の状態に飛ばす（管理者権限・操作ログ必須）
- **連鎖停止フラグ**: Order に `disableShipmentAutoCreate: true` を立てると Shipment 自動生成を抑止
- **巻き戻し**: 「出荷済み」→「出荷待ち」（伝票番号取り消し）。Shipment 側のみ。Order 側は手動で「印刷済みに戻す」を別途叩く必要がある。

## 10. 既存ページへの影響

| ページ | 影響 | 修正方針 |
|---|---|---|
| `src/app/shipments/page.tsx` | 状態セットを4→8に変更 | タブ・バッジを `state-machines/shipment.ts` から import |
| `src/app/shipments/confirm/page.tsx` | 出荷確定 = `confirmShipment` 経由化 | 直接 setStatus 禁止 |
| `src/app/shipments/inspection-barcode/page.tsx` | 検品 = `passInspection`/`failInspection` 経由化 | 同上 |
| `src/app/shipments/notification-import/page.tsx` | CSV取込 = `markInTransit`/`markDelivered` 経由化 | 同上 |
| `src/app/orders/page.tsx` | 影響なし（Order の状態名は変えない） | — |

## 11. 冪等性の例

```ts
// 二重スキャンしても safe
const after1 = transitionShipment(shipment, "passInspection");
const after2 = transitionShipment(after1, "passInspection"); // no-op
assert(after1 === after2); // 同一参照
```

```ts
// 出荷済みのキャンセル試行は no-op
const shipped = { status: "出荷済み", orderIds: ["ORD-1"] };
const cancelled = transitionShipment(shipped, "cancel");
assert(shipped === cancelled); // 同一参照（変化なし）
```

## 12. 残作業（別 PRD で扱う）

- 在庫ドメイン状態機械（`src/lib/state-machines/inventory.ts`）— 引当・引当解放のロジック
- 入金ドメイン状態機械（`src/lib/state-machines/payment.ts`）— Order と入金の整合
- イベントハンドラ実装（`src/lib/events/order-handlers.ts`、`shipment-handlers.ts`、`inventory-handlers.ts`）
- 出荷ページ群の状態機械統合リファクタ
- 返品処理フロー（出荷済み以降の取消）
- 配送業者API連携（楽天スーパーロジ・ヤマト・佐川・日本郵便）
