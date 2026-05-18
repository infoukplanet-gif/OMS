# 自動メールトリガー PRD v1

**作成日:** 2026-05-18
**ステータス:** 確定（実装着手可）
**スコープ:** 機能間連動フェーズの第3段。受注/出荷/入金 SM の遷移を契機に自動メール送信ジョブを enqueue する基盤を作る。

---

## 1. 背景

`src/app/mail/auto/page.tsx` には既に「自動送信トリガー」の UI 設定がある（8 種類）。しかし実際にトリガーを発火する仕組みがなく、設定 ON/OFF が業務に反映されていない。

機能間連動フェーズ①(state machines) と ②(calculations / handlers) の整備が済んだので、handler の effects に `sendMail` 記述子を追加し、SM 遷移と同じレールに乗せる。

参考: [`order-state-machine.md`](./order-state-machine.md), [`payment-state-machine.md`](./payment-state-machine.md), [`events-integration-v1.md`](./events-integration-v1.md)

---

## 2. v1 で対象にするトリガー（Interview 確定）

| triggerType | 発火元 | 発火条件 |
|---|---|---|
| `thanks` | order handler | 受注が `新規受付` / `確認待ち` から `入金待ち` / `引当待ち` / `発売日時待ち` へ確定したとき（＝受注確定の初回遷移） |
| `ship-notify` | shipment handler | 受注が `印刷済み` → `出荷済み` に遷移したとき |
| `payment-confirmed` | payment handler | payment SM で `recordPayment` 成功し `入金確認` または `超過入金` に遷移したとき |

### v1 スコープ外

- 入金催促（3日/7日）— スケジューラ層が必要。v2。
- 在庫切れ連絡 — `inventoryShortage` 検知時のメール。v2。
- フォロー / レビュー依頼 — 発送後 N 日トリガー。v2。
- 再発送のお知らせ — 専用フローの設計が未着手。v2。

---

## 3. 設計判断（Interview 回答）

### Q1. 発火層 — Handler の effects に追加（推奨）

handler 関数は `sendMail` 記述子を `effects` に積むだけ。実際の enqueue / 送信は呼び出し元（ページ or 将来の server action）の責務。

```ts
interface SendMailEffect {
  orderId: string;
  triggerType: "thanks" | "ship-notify" | "payment-confirmed";
  dedupeKey: string; // `${orderId}:${triggerType}` 形式
}
```

ドメインイベントを記述子で表現する設計（`events-integration-v1.md` §2）を継承する。

### Q2. 冪等性 — `(orderId, triggerType)` で重複送信を抑止

- handler は無条件に `sendMail` 記述子を返す。
- 重複抑止は **mail queue 層**（v1 では in-memory Set でモック、将来は DB の一意制約）が担当する。
- `dedupeKey` は `${orderId}:${triggerType}` で組み立て、queue 側でユニークキーとして使う。
- 同じ key の 2 回目以降は no-op として skip し、ログに `duplicate-skipped` を残す（v1 はトーストで可視化）。

### Q3. 失敗時の連鎖 — 状態遷移はそのまま進める

- メール送信失敗は **業務上致命ではない** と扱う。
- 出荷登録に成功した時点で受注は `出荷済み` で確定し、メール失敗は別ジョブで再試行する。
- handler は effects を返すだけなので、handler 自体は失敗しない。
- 再試行回数は `mail/auto` 設定の `retryMax` を将来サーバ実装時に参照（v1 はモック）。

### Q4. 手動オーバーライド

- `mail/auto/page.tsx` の `enabled: false` トリガーは handler 呼び出し元で skip する。
- v1 ではフラグ参照を `getMailAutoSettings()` 関数化し、effects を queue に投げる前に filter する。
- handler 自体はフラグを知らない（純粋関数を維持）。

---

## 4. 既存ページへの影響

| ページ | 影響 |
|---|---|
| `orders/page.tsx` | 一括操作（印刷済みにする、キャンセル等）後に effects を queue に流す。送信件数を toast 表示 |
| `shipments/page.tsx` | 出荷登録ボタン経由で `ship-notify` 発火。送信件数を toast 表示 |
| `payments/register/page.tsx` | 入金記録ボタン経由で `payment-confirmed` 発火 |
| `mail/auto/page.tsx` | UI のフラグが handler effects の filter で実機能化される（v2 でサーバと接続） |
| `mail/pending/page.tsx` | queue 内の重複抑止結果が可視化される（v2） |

---

## 5. 受注確定の判定ルール（`thanks` トリガー）

受注確定は次の遷移を指す（重複しないように `before.status` で判定）。

```text
before.status ∈ { "新規受付", "確認待ち" }
&& after.status ∈ { "入金待ち", "引当待ち", "発売日時待ち" }
```

同じ受注について 1 回だけ送る（dedupeKey で抑止）ので、`新規受付 → 確認待ち → 入金待ち` のように 2 段で遷移した場合でも実送信は 1 件になる。

---

## 6. テスト戦略

`src/lib/events/*-handlers.test.ts` に各トリガーの発火条件・dedupeKey の組み立てをユニットテストで網羅する（TDD 強制範囲）。

- 受注確定遷移で `sendMail` effect が返ること
- 既に同 status の場合は effect なし
- キャンセル等の対象外遷移で effect なし
- dedupeKey が `${orderId}:${triggerType}` 形式

queue 側の重複抑止は v1 では実装しない（filter 関数だけ書く / mock）。

---

## 7. v1 で実装するファイル

- `docs/prd/mail-trigger-v1.md`（本ファイル）
- `src/lib/events/order-handlers.ts` — `sendMail` effect 追加
- `src/lib/events/shipment-handlers.ts` — `sendMail` effect 追加
- `src/lib/events/payment-handlers.ts` — `sendMail` effect 追加
- 各 `*.test.ts` — TDD

v2 で実装するもの

- `src/lib/mail/queue.ts` — dedupe + retry + 実送信
- `src/app/mail/pending/page.tsx` — queue の状況可視化
- スケジューラ層（入金催促・フォロー）

---

## 8. オープン項目（v2 で議論）

- 送信先メールアドレスの解決ルール（受注の customer email）
- テンプレート差し込み変数の正規化
- 多言語化（楽天/Amazon 流入の英語顧客）
- バウンス処理
