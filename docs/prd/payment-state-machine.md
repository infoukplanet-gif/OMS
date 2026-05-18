# 入金ドメイン状態機械 v1 仕様書

**作成日:** 2026-05-15
**ステータス:** 確定（実装着手可）
**スコープ:** 機能間連動フェーズ・第5段。入金ドメインの状態機械を `src/lib/state-machines/payment.ts` に集約し、入金確認 → 受注「入金待ち→引当待ち」連鎖の基盤を作る。

> 関連: [`order-state-machine.md`](./order-state-machine.md) §3-§4 / [`events-integration-v1.md`](./events-integration-v1.md)

---

## 1. 概要

受注ごとの入金状況を `PaymentState` として表現し、`recordPayment / cancelPayment` のプリミティブ操作で累計入金額を更新する。
ステータス（未入金 / 一部入金 / 入金済み）は累計入金額と受注金額の照合から**派生**させ、判定式を1箇所に固定する。
受注↔入金の橋渡しは `events/payment-handlers.ts` が記述子（`cascadeOrderAction`）として返す。

**v1 スコープ:**
- 3状態: 未入金 / 一部入金 / 入金済み（参考資料 `reference/screenshot/入金確認_詳細検索1.png` の入金区分に準拠）
- プリミティブ: `recordPayment`（入金登録）/ `cancelPayment`（入金取消・返金）
- 派生関数: `paymentStatusOf`、`overpaid` フラグ（受注金額超過の検知）
- events handler: 入金済み到達 → 受注を引当待ちへ / 入金済みから巻き戻り → 受注を入金待ちへ

**v1 スコープ外:**
- 支払方法別の入金処理（楽天カード / Yahoo!かんたん決済 / NP後払い 等の API 連携）
- 入金催促メールの自動トリガー（入金未確認3日/7日）— `events/payment-reminder-handlers.ts` で次フェーズ
- 一部入金分割払いのスケジュール管理
- 返金処理の会計連動（売上戻し計上）
- 複数受注の一括入金消込（`calculations/payment-matching.ts` で次フェーズ）

---

## 2. 状態セット（3状態）

| # | 状態 | 説明 | 派生条件 |
|---|------|------|----------|
| 1 | 未入金 | 入金が1円も記録されていない | `paidAmount <= 0` |
| 2 | 一部入金 | 入金はあるが受注金額に満たない | `0 < paidAmount < orderTotal` |
| 3 | 入金済み | 累計入金額が受注金額以上 | `paidAmount >= orderTotal` |

**Why:** 「0:未入金 / 1:一部入金 / 2:入金済み」は参考資料の入金区分タブ名と完全一致させる。独自命名（「完済」等）は使わない。oms-field-auditor の機械的監査を通すため。

**過入金（overpaid）:** `paidAmount > orderTotal` のとき `overpaid: true` を立てる。状態は「入金済み」のまま。過入金を独立状態にはしない（参考資料に無い独自状態を増やさないため）。返金が必要かは運用画面で `overpaid` フラグを見て判断する。

---

## 3. 主要型

```ts
export type PaymentStatus = "未入金" | "一部入金" | "入金済み";

export interface PaymentState {
  /** 派生ステータス。recordPayment / cancelPayment が paidAmount から再計算する。 */
  status: PaymentStatus;
  /** 受注金額（照合対象。状態機械はこの値を変更しない）。 */
  orderTotal: number;
  /** 累計入金額。 */
  paidAmount: number;
  /** 受注金額を超過しているか（paidAmount > orderTotal）。「入金済み」時のみ true になりうる。 */
  overpaid: boolean;
}
```

`status` と `overpaid` は `paidAmount` / `orderTotal` から導出可能な派生値だが、UI 層が毎回計算しなくて済むよう `PaymentState` に保持する。プリミティブ操作が更新のたびに再計算して整合を保つ。

---

## 4. プリミティブ操作

すべて pure function、イミュータブル更新、guard 違反時 no-op で参照同一性保持（order / shipment / inventory 状態機械と同じ規約）。

### 4.1 paymentStatusOf（派生関数）

```ts
export function paymentStatusOf(orderTotal: number, paidAmount: number): PaymentStatus;
```

判定ルール（上から先勝ち）:
| 条件 | ステータス |
|---|---|
| `paidAmount <= 0` | 未入金 |
| `paidAmount >= orderTotal` | 入金済み |
| その他 | 一部入金 |

### 4.2 recordPayment

```ts
export function recordPayment(state: PaymentState, amount: number): PaymentState;
```

入金登録。累計入金額に `amount` を加算し、`status` / `overpaid` を再計算する。

- 前提: `amount > 0`
- 成功: `paidAmount += amount`、`status` / `overpaid` を再計算
- guard 違反（`amount <= 0`）: 元の state を返す（参照同一）

### 4.3 cancelPayment

```ts
export function cancelPayment(state: PaymentState, amount: number): PaymentState;
```

入金取消・返金。累計入金額から `amount` を減算し、`status` / `overpaid` を再計算する。誤入金訂正・返金に使う。

- 前提: `amount > 0` かつ `amount <= state.paidAmount`
- 成功: `paidAmount -= amount`、`status` / `overpaid` を再計算
- guard 違反（`amount <= 0` または `amount > paidAmount`）: 元の state を返す（参照同一）

`amount === paidAmount` のとき全取消 → `paidAmount = 0` → 未入金。

---

## 5. 冪等性

- 全プリミティブは guard 違反時 no-op で元のオブジェクトをそのまま返す（throw しない）。
- `recordPayment` は「同じ amount を二重登録」のようなアプリ側の誤りは guard では検知できない（呼び出し元責務）。入金登録は累計加算なので、二重実行を防ぐのは入金伝票ID の重複チェック（呼び出し元）で行う。
- `cancelPayment` は二重取消しても `amount > paidAmount` guard が効いて safe（残額を超える取消は no-op）。

---

## 6. events 連動

### 6.1 PaymentTransitionEffects

```ts
export interface PaymentTransitionEffects {
  /**
   * Payment の遷移を受けて Order 側に叩く要求。
   *  - confirmPayment       : 入金済み到達時（受注: 入金待ち → 引当待ち）
   *  - revertToPaymentWait  : 入金済みから巻き戻った時（受注: 引当待ち → 入金待ち）
   */
  cascadeOrderAction?: {
    orderId: string;
    action: "confirmPayment" | "revertToPaymentWait";
  };
}
```

### 6.2 onPaymentTransitioned

```ts
export function onPaymentTransitioned(
  before: PaymentState,
  after: PaymentState,
  orderId: string,
  options?: { orderStatus?: OrderStatus },
): PaymentTransitionEffects;
```

**動作:**
- `before.status !== "入金済み"` かつ `after.status === "入金済み"` の時、`cascadeOrderAction: { orderId, action: "confirmPayment" }` を返す。
- `before.status === "入金済み"` かつ `after.status !== "入金済み"`（＝未入金 or 一部入金へ巻き戻り）の時、**`options.orderStatus === "引当待ち"` の場合のみ** `cascadeOrderAction: { orderId, action: "revertToPaymentWait" }` を返す。
  - 受注が既に印刷待ち以降へ進んでいる場合は巻き戻さない（下記 §7 参照）。
- それ以外は `{}` を返す。

2つの条件は `before.status` の値で排他なので衝突しない。handler 自身は db を触らない pure function。記述子の実行（`transitionOrder`）は呼び出し元の責務。

### 6.3 一部入金時の受注ステータス

一部入金（`0 < paidAmount < orderTotal`）の間、受注は「入金待ち」のまま据え置く。
全額入金（入金済み到達）まで引当・出荷指示は走らせない。`onPaymentTransitioned` は一部入金への遷移では `{}` を返す。

---

## 7. 失敗時のロールバック

| 失敗・例外ケース | v1 の対応 |
|---|---|
| `recordPayment` 実行後の受注連鎖（`confirmPayment`）が guard 違反 | 受注が既に引当待ち以降。入金は記録済みで実害なし。記述子は no-op で吸収される（`transitionOrder` が冪等） |
| 入金取消時、受注が既に印刷待ち以降へ進行済み | `options.orderStatus !== "引当待ち"` なので `cascadeOrderAction` を返さない。入金の巻き戻しのみ記録し、受注はそのまま。**運用画面で手動対応が必要**（返品フロー or 手動ステータス補正） |
| 入金取消時、受注が出荷済み | 同上。返金は別フロー（会計連動は v1 スコープ外）。受注は触らない |
| `cancelPayment` が残額超過で no-op | 既に取消済みの可能性が高い。整合チェック（`events/integrity-checks.ts`、次フェーズ）で日次検出 |

**設計判断:** 入金取消の受注巻き戻しは「受注がまだ引当待ちに留まっている」場合のみ自動化する。印刷待ち以降の巻き戻しは物理的な印刷物・出荷指示の取り消しを伴うため、自動連鎖の範囲外とし運用判断に委ねる。

---

## 8. 手動オーバーライド

- 入金確認そのものが手動操作（受注状態機械 v1 §3「自動化の境界」— 入金確認は人手が介入する2点のうちの1点）。`recordPayment` を叩くのは入金登録画面のオペレータ。
- 入金取消・返金も手動操作。`cancelPayment` を叩くのは管理者。
- 受注の `revertToPaymentWait` 連鎖は `cancelPayment` の副作用記述子として自動発火するが、§7 の通り受注が引当待ちにいる時のみ。

---

## 9. order 状態機械への影響

入金取消時の受注巻き戻しのため、受注状態機械に新しいアクション **`revertToPaymentWait`** を追加する（`docs/prd/order-state-machine.md` §3 を併せて更新）。

| アクション | from | to | 種別 |
|---|---|---|---|
| `revertToPaymentWait` | 引当待ち | 入金待ち | manual（入金取消の連鎖） |

- guard: `["引当待ち"]`
- 結果: `status = "入金待ち"`、`inventoryShortage` をクリア（引当待ちを抜けるのでバッジは無意味になる）
- 引当待ち以外からの呼び出しは no-op（冪等）

---

## 10. 既存ページへの影響

| ページ | 影響 | 修正方針 |
|---|---|---|
| `src/app/payments/page.tsx` | 入金ステータス派生ロジックを `paymentStatusOf()` に置換可能 | UI 統合フェーズで合流（今フェーズは状態機械側のみ） |
| `src/app/payments/register/page.tsx`（入金登録） | 入金登録時に `recordPayment` を経由 | UI 統合フェーズで合流 |
| `src/app/orders/page.tsx` | `revertToPaymentWait` で受注が引当待ち→入金待ちに戻りうる | `transitionOrder` 経由なので追加対応不要 |

UI 統合（status 派生のリファクタ）は今フェーズでは行わず、状態機械側を整えた上で次の UI 統合フェーズで合流させる（inventory v1 と同じ進め方）。

---

## 11. テスト戦略

- `src/lib/state-machines/payment.test.ts` — `paymentStatusOf` / `recordPayment` / `cancelPayment` を vitest で TDD（RED→GREEN）。境界値（`paidAmount === orderTotal`、過入金、全取消、guard 違反）を網羅。
- `src/lib/events/payment-handlers.test.ts` — `onPaymentTransitioned` の全分岐（入金済み到達 / 巻き戻り×orderStatus 各値 / 変化なし）を網羅。
- `src/lib/state-machines/order.test.ts` — `revertToPaymentWait` のテストを追加。
- カバレッジ目標: 100%（すべて pure function）。

---

## 12. 受け入れ基準

1. `src/lib/state-machines/payment.ts` が存在し、3状態を `PaymentStatus` 型で表現している
2. `recordPayment` / `cancelPayment` が累計入金額を更新し、`status` / `overpaid` を再計算する
3. guard 違反時に no-op で同じ state を返す（throw しない）
4. `src/lib/events/payment-handlers.ts` の `onPaymentTransitioned` が §6.2 の通り記述子を返す
5. `transitionOrder(order, "revertToPaymentWait")` が引当待ち→入金待ちに遷移する
6. `npx vitest run` が全テストグリーン、`npx tsc --noEmit` がエラーなく通る
