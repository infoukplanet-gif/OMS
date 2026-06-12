# 卸先与信限度チェック（受注登録ゲート）PRD v1

**作成日:** 2026-06-10
**ステータス:** 確定（実装中）
**スコープ:** 機能間連動フェーズ。卸先（B2B）受注の登録時に、与信限度を超える受注を検知して警告/ブロックする連鎖を作る。受注↔卸先マスタ↔入金をまたぐ enforcement。

---

## 1. 背景

受注登録フォーム（`src/components/forms/order-form.tsx`）は顧客コード欄（`customerCode`）を持つが、保存時に 2 つの欠陥がある。

1. **`customerCode` を受注に書き込んでいない。** `save()` が組み立てる `newOrder: OrderSeed` に `customerCode` が無く、フォーム経由で作った B2B 受注は卸先に紐付かない（`computeOrderCreditOutstanding` の集計対象にすらならない）。
2. **与信限度チェックが一切ない。** 卸先が与信限度を超える受注も無言で保存される。

一方、卸先一覧（`customers/wholesale`）は `computeOrderCreditOutstanding` で「未回収残＋今回分」を live 算出し「与信使用90%以上」アラートまで出している。**登録時のゲートだけが欠落**している。シードにも危険な卸先が実在する。

| 卸先 | 限度 | 使用(seed) | 状態 |
|---|---|---|---|
| WS-008 南九州ロジ | 400,000 | 412,000 | **既に超過** |
| WS-006 関西商事 | 1,200,000 | 1,180,000 | 98% |
| WS-009 東北物流 | 0 | 18,000 | **停止** |

---

## 2. 設計判断（Interview 確定・全推奨）

### Q1. 超過時の挙動 — 警告して続行可（推奨）

限度超過でも保存は止めない。確認ダイアログで「与信オーバー（残り枠¥X / 不足¥Y）」を提示し、担当者が「承知して登録」を押せば保存できる。実務では一時的な超過を運用判断で通すケースが多いため、ブロックではなく気づかせる方式。

### Q2. 限度ゼロ / 取引停止の卸先 — 取引不可で常にブロック（推奨）

与信限度 `0` または取引ステータス `停止` の卸先は、**金額に関わらず受注を弾く**（保存不可）。与信ゼロ＝与信を与えていない取引先という会計実態に合わせる。これは Q1 の「警告して続行可」より優先される **ハードブロック**。

→ 挙動は 2 段構え:
- `停止` または 限度 `<= 0` → **block**（保存不可・エラー toast）
- それ以外で `未回収残 + 今回受注額 > 限度` → **warn**（確認ダイアログで続行可）
- 限度内 → **ok**（そのまま保存）

### Q3. 判定の基準額 — 未回収残＋今回受注額（推奨）

判定額 = `現在の与信使用額（未回収残）+ 今回登録する受注額` を限度と比較する。「現在の与信使用額」は卸先一覧と同じ定義（`record.creditUsed`(legacy baseline) + `computeOrderCreditOutstanding(code, orders, payments)`）を使い、**一覧画面の数字と判定がズレない**ようにする。

### 適用範囲（Interview 派生）

- チェックが走るのは `customerCode` が **卸先マスタに実在する** 受注のみ。B2C 個人受注（`customerCode` 空 / 卸先に無いコード）はチェックせず素通り（ok）。
- 「与信限度更新 → 既存受注の再チェック」は卸先一覧が既に live 再計算しているため v1 ではゲート（登録時）に集中。一覧の警告がそのまま再チェックを兼ねる。

---

## 3. アーキテクチャ

```
受注登録フォーム order-form.tsx save()
  └─ customerCode から wholesaleStore で卸先レコード解決
  └─ currentOutstanding = record.creditUsed + computeOrderCreditOutstanding(code, orders, payments)
  └─ checkCredit({creditLimit, customerStatus, currentOutstanding, newOrderAmount})  // 純粋calc
        ├─ "block" → エラー toast、保存中止
        ├─ "warn"  → 確認ダイアログ → 続行で保存
        └─ "ok"    → そのまま保存
  └─ newOrder に customerCode を含めて append（欠陥①も修正）
```

| 層 | ファイル | 役割 |
|---|---|---|
| calc（純粋・Date-free） | `src/lib/customers/credit-check.ts` | `checkCredit(input): CreditCheckResult`。block/warn/ok 判定・残枠・不足額・理由文 |
| calc（既存） | `src/lib/customers/credit-usage.ts` | `computeOrderCreditOutstanding`（未回収残の合算）を再利用 |
| store（既存） | `wholesaleStore` / `orderStore` / `paymentStore` | 卸先レコード・受注・入金 |
| UI | `src/components/forms/order-form.tsx` | 解決→判定→ダイアログ。customerCode 伝播修正 |

判定は純粋関数に集約し、`Date` も store singleton も触らない（`src/lib` Date-free 維持）。フォームが数値を集めて渡す。

### 型

```ts
export type CreditCheckStatus = "ok" | "warn" | "block";

export interface CreditCheckInput {
  creditLimit: number;        // 卸先の与信限度
  customerStatus: string;     // "通常" | "重点" | "新規" | "停止" 等
  currentOutstanding: number; // 既存の与信使用額（未回収残）
  newOrderAmount: number;     // 今回登録する受注額
}

export interface CreditCheckResult {
  status: CreditCheckStatus;
  projectedUsage: number;     // currentOutstanding + newOrderAmount
  available: number;          // max(0, creditLimit - currentOutstanding)（今回前の残り枠）
  overBy: number;             // max(0, projectedUsage - creditLimit)
  reason: string;             // 日本語の理由（ダイアログ/toast 用）
}
```

判定ロジック:
1. `customerStatus === "停止"` → block（理由「取引停止中の卸先です」）
2. `creditLimit <= 0` → block（理由「与信限度が設定されていません（取引不可）」）
3. `projectedUsage > creditLimit` → warn（理由「与信限度を¥{overBy}超過します」）
4. それ以外 → ok

---

## 4. 既存ページへの影響

| ページ/ファイル | 影響 |
|---|---|
| `src/components/forms/order-form.tsx` | save() に与信ゲート追加。block=保存中止、warn=確認ダイアログ。`newOrder` に `customerCode` を含める（紐付け修正） |
| `customers/wholesale/page.tsx` | 変更なし。フォームが customerCode を書くようになり、live 与信使用額が実受注を正しく反映するようになる（副次改善） |

---

## 5. テスト戦略

`credit-check.test.ts` で TDD 強制範囲を網羅。

- 停止卸先 → block（金額・限度に関わらず）
- 限度 0 / 負 → block
- 限度内（projected <= limit）→ ok、available 正しい
- 限度超過（projected > limit）→ warn、overBy 正しい
- 境界: projected === limit はちょうど ok（超過は厳密 >）
- 停止 かつ 限度あり でも block 優先
- overBy / available は負にならない（clamp）

---

## 6. v1 実装ファイル

- `docs/prd/credit-limit-check-v1.md`（本ファイル）
- `src/lib/customers/credit-check.ts` + `.test.ts`
- `src/components/forms/order-form.tsx`（ゲート配線 + customerCode 伝播）

---

## 7. オープン項目（v2 で議論）

- 承認チェック付きブロック（Q1 第3案）への切替設定
- 与信限度更新時の既存受注一括再チェック・アラート通知
- 与信枠の予約（引当済み未請求分の枠確保）
- 支払遅延（delays）を与信判定に織り込む（停止自動化）
- server action 化時の判定の排他制御
