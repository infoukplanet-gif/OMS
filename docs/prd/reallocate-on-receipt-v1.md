# 入荷→欠品受注の自動再引当 PRD v1

**作成日:** 2026-06-09
**ステータス:** 確定（実装済み）
**スコープ:** 機能間連動フェーズ。在庫入荷を契機に、欠品で引当待ちに滞留していた受注を自動で再引当する連鎖を作る。

---

## 1. 背景

入荷で在庫 `onHand` が増えても、`inventoryShortage=true` で `引当待ち` に滞留していた受注は自動では再引当されず、`products/allocation/auto`（引当自動実行処理）ページでユーザーが手動バッチを叩く必要があった。

state machines / calculations / cascades のレールが整ったので、入荷 cascade（`receiveInventory` / `restockInventory` の effects）の直後に、欠品滞留受注の再引当 cascade を連結する。

参考: [`inventory-state-machine.md`](./inventory-state-machine.md), [`order-state-machine.md`](./order-state-machine.md), [`events-integration-v1.md`](./events-integration-v1.md)

---

## 2. 発火点（Interview 確定）

入荷で在庫が増える 3 箇所すべてで発火する（「返品戻しも含む全入荷」）。

| 発火元ページ | 入荷の種類 | effects |
|---|---|---|
| `purchasing/page.tsx` | 発注入荷（確定） | `receiveInventory.lines` |
| `purchasing/receiving/page.tsx` | 入荷登録（単発・一括） | `receiveInventory.lines` |
| `returns/page.tsx` | 顧客返品の良品戻し | `restockInventory.lines` |

各ページは在庫加算（`inventoryStore.applyReceive(lines)`）の **直後** に `runAutoReallocateOnReceipt(lines)` を 1 行呼ぶだけ。

---

## 3. 設計判断（Interview 回答）

### Q1. 発火範囲 — 返品戻しも含む全入荷

発注入荷・入荷登録・返品の良品戻しの 3 点すべてで発火する。「在庫が増える」というドメイン事実が同じである以上、入荷経路で挙動を分けない。

### Q2. 手動オーバーライド — 設定で ON/OFF 可能（デフォルト ON）

- グローバル設定 `getAutoReallocateSettings().enabled` を `runAutoReallocateOnReceipt` の先頭で参照。
- `false` の場合は何もせず空結果（`{ processed: 0, allocated: 0, shortage: 0 }`）を返し、`products/allocation/auto` ページのマニュアル実行に委ねる。
- 設定 UI は `products/allocation/auto/page.tsx` の引当ルールカードに同居（マニュアル実行のホームと同じ場所に置くことで、OFF の委譲先が自明になる）。

### Q3. 対象スコープ — 入荷 SKU 関連の欠品のみ

- 再引当の対象は「`status === "引当待ち" && inventoryShortage === true`」かつ「需要明細（`order.allocation`）に入荷 SKU を含む」受注に限定する。
- 入荷と無関係な欠品受注は触らない（無駄な再計算と意図しない引当順の揺れを防ぐ）。
- 受信 SKU 集合が空、または対象受注ゼロなら即空結果を返す。

### Q4. 冪等性 — 成功でスコープ外へ抜ける

- 再引当が成功した受注は `引当待ち` から `印刷待ち` 等へ前進し、次回入荷時には対象集合から外れる（`status` / `inventoryShortage` の条件で自然に除外）。
- 在庫が需要に満たない場合は `inventoryShortage=true` のまま据え置き、次の入荷で再挑戦する。
- 二重引当は `allocatePendingOrders` 側のガードで回避（既存の一括引当 cascade を再利用）。

### Q5. 失敗時のロールバック — なし

- 入荷（在庫加算）は既に確定済み。再引当はその後段の最適化であり、失敗しても在庫加算は巻き戻さない。
- 再引当 cascade は純粋関数 + store 適用で、部分適用が起きても在庫整合は保たれる（引当は available 在庫の範囲でしか進まない）。

---

## 4. アーキテクチャ

```
入荷ページ (3点)
  └─ inventoryStore.applyReceive(lines)        // 在庫加算（既存）
  └─ runAutoReallocateOnReceipt(lines)         // ← 追加した1行
        └─ getAutoReallocateSettings().enabled // OFFなら即return
        └─ reallocateOnReceipt({orderStore, inventoryStore}, lines)  // 純粋cascade
              └─ 対象抽出（引当待ち+shortage+入荷SKU関連）
              └─ allocatePendingOrders(deps, {orderIds, rules})       // 既存一括引当を再利用
```

| 層 | ファイル | 役割 |
|---|---|---|
| cascade（純粋） | `src/lib/cascades/reallocate-on-receipt.ts` | DI store 受け取り。対象抽出 → 一括引当委譲。テスト対象 |
| glue（薄い） | `src/lib/cascades/run-auto-reallocate.ts` | global singleton store + 設定読み取りを 1 箇所に閉じ込める UI 向け接着剤 |
| 設定 | `src/lib/inventory/auto-reallocate-settings.ts` | module-scoped singleton（get はコピー返し / set は partial / reset） |
| UI トグル | `src/app/products/allocation/auto/page.tsx` | 引当ルール保存時に `setAutoReallocateSettings` |

純粋 cascade は DI で store を受けるためテスト可能なまま、global singleton と設定参照を glue 1 層に隔離する DRY 設計。3 ページは各 1 行追加で済む。

---

## 5. 既存ページへの影響

| ページ | 影響 |
|---|---|
| `purchasing/page.tsx` | 発注入荷確定後に自動再引当。`欠品受注 N件 自動引当` を toast に追記 |
| `purchasing/receiving/page.tsx` | 入荷登録（単発・一括）後に自動再引当。toast に件数追記 |
| `returns/page.tsx` | 返品良品戻し後に自動再引当。toast に件数追記 |
| `products/allocation/auto/page.tsx` | 引当ルールカードに ON/OFF トグル追加。保存時に設定反映 |

---

## 6. テスト戦略

`src/lib/cascades/reallocate-on-receipt.test.ts`（7 件）と `src/lib/inventory/auto-reallocate-settings.test.ts`（4 件）で TDD 強制範囲を網羅。

- 入荷 SKU を需要に含む欠品受注が再引当されること
- 入荷 SKU と無関係な欠品受注は据え置かれること
- `inventoryShortage=false` / `引当待ち` 以外は対象外
- 受信 SKU 空 / 対象ゼロで空結果
- 在庫不足なら `shortage` を残す
- 設定 get はコピー / set は partial / reset でデフォルト復帰

---

## 7. v1 で実装したファイル

- `docs/prd/reallocate-on-receipt-v1.md`（本ファイル）
- `src/lib/cascades/reallocate-on-receipt.ts` + `.test.ts`
- `src/lib/cascades/run-auto-reallocate.ts`
- `src/lib/inventory/auto-reallocate-settings.ts` + `.test.ts`
- `src/app/purchasing/page.tsx`（1 行配線 + toast）
- `src/app/purchasing/receiving/page.tsx`（単発・一括に配線 + toast）
- `src/app/returns/page.tsx`（1 行配線 + toast）
- `src/app/products/allocation/auto/page.tsx`（ON/OFF トグル）

---

## 8. オープン項目（v2 で議論）

- 再引当が走った受注の通知（ユーザーへの可視化を toast 以上にするか）
- 入荷ロット単位の引当順（先入れ先出しを引当ルールに反映するか）
- 部分入荷で需要の一部しか満たせない場合の按分ポリシー
- server action 化したときの再引当の排他制御（同時入荷の競合）
