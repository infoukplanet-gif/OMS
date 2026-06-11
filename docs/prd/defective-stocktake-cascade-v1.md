# 棚卸減耗 ↔ 不良在庫 連動 cascade v1

最後の未配線連動エッジ。**棚卸差異（減耗）** と **不良品振替** を在庫（良品 onHand）へ双方向に接続する。

## 背景 / 解消する嘘

不良品振替ページ（`shipments/defective`）は「振替実行時に在庫数を自動更新」と謳いながら、実際にはローカル state を書き換えるだけで `inventoryStore`（良品在庫）には一切触れていなかった。棚卸ページ（`products/stocktaking`）も減耗（実棚 < システム）を確定すると onHand は減るが、その損失が **不良品台帳に痕跡として残らない**。本 v1 で両方向を実配線する。

## スコープ（双方向フル）

- **方向①｜棚卸減耗 → 不良品台帳**: 棚卸で実棚 < システム在庫だった不足分を、不良品台帳に「監査記録」として登録する。
- **方向②｜不良品振替実行 → 良品 onHand 減算**: 承認済みの不良品振替を「振替実行」したとき、対象 SKU の良品 onHand を振替数だけ減算する。

## 確定した設計判断

### 発火条件 = 手動選択（自動登録しない）

棚卸で不足が出ても自動では台帳に積まない。棚卸担当者が負差異の行ごとに **「減耗登録」ボタン** を明示的に押した分だけ登録する。過剰差異（実棚 > システム）は減耗ではないため登録対象外。

### 在庫モデル = 良品 onHand 減算のみ（不良在庫バケットを持たない）

`inventoryStore` は良品在庫の単一バケットのまま。振替／廃棄／減耗はすべて良品 onHand を減算するだけで、別建ての不良在庫バケットは作らない（KISS — seed に不良倉庫が存在しない）。

### 二重減算の回避

方向①の減耗記録は最初から `status: "振替完了"` / `source: "stocktake"` で生成し、**onHand を減算しない**。理由:

- 棚卸の onHand 減算は `confirmDiff()` が唯一の権威。減耗記録は台帳上の痕跡（監査記録）に過ぎない。
- `status: "振替完了"` なので cascade の `execute` 遷移の対象にならず、後から在庫を二重に減らすことが構造的に不可能。

## 状態機械 `src/lib/state-machines/defective.ts`

- `DefectiveStatus = "承認待ち" | "振替待ち" | "振替完了" | "却下"`
- `DefectiveAction = "approve" | "reject" | "execute"`
- `DefectiveSource = "manual" | "stocktake"`
- 遷移: 承認待ち --approve--> 振替待ち / 承認待ち --reject--> 却下 / 振替待ち --execute--> 振替完了
- 無効な遷移は同一参照を返す（no-op）。

## 計算 `src/lib/calculations/shrinkage-defective.ts`

`buildShrinkageDefectives(lines, meta)` — 純関数。`qty > 0` の行のみ `status:"振替完了" / source:"stocktake" / route:"廃棄" / reason:"棚卸減耗" / order:"—"`、id=`${idPrefix}-NNN`。Date を持たず、登録日時・登録者・id 接頭辞は呼び出し側が渡す。

## cascade `src/lib/cascades/transfer-defective.ts`（方向②）

`executeDefectiveTransfer(deps, {id})`:
1. `applyTransition(id, "execute")` で 振替待ち → 振替完了。無効なら `{applied:false}`。
2. 対象 SKU/倉庫の良品 onHand を `applyAdjust([{sku, warehouse, delta:-qty}])` で減算。
3. 対象在庫が見つからない場合は `unknownInventory:true` を返し、台帳は完了済みだが onHand は据え置き（保留）。

glue `run-transfer-defective.ts` が `defectiveStore` + `inventoryStore` のシングルトンを束ねる。

## 冪等性

- 方向①: `defectiveStore.register` は id 重複を弾く（`{applied:false}`）。同一 SKU を同分内に再クリックしても二重登録されない。
- 方向②: `execute` は 振替待ち の record のみ前進。振替完了済みを再実行しても no-op。

## UI 配線

- **`shipments/defective`** — 不良品ドメインの正規永続化オーナー（`usePersistentStore({domain:"defective"})`）。承認/却下=`applyTransition`、振替実行=`runDefectiveTransfer`（在庫未検出時は正直に「onHand は未更新」と通知）。棚卸由来は 棚卸減耗 バッジ表示。
- **`products/stocktaking`** — 負差異行に「減耗登録」ボタン（手動選択）。`buildShrinkageDefectives` → `defectiveStore.register`。onHand は触らない（`confirmDiff` が権威）。

## 永続化

`SnapshotDomain` に `"defective"` を追加済み。`store_snapshots` 単一テーブル + 汎用 snapshot/restore。DATABASE_URL 未設定時は in-memory フォールバック。

## テスト

state-machine / store / calculations / cascade の 4 ファイル計 26 テスト GREEN。フルスイート 671 テスト GREEN。
