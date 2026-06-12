# PRD: Mock島一掃 v1（金額不整合 / 不良欠品 / NP・atone / テンプレート永続化）

## 背景

主要 cascade（受注↔出荷↔入金↔在庫↔発注↔買掛）の配線完了後も、
共有ストアに接続されていない「Mock島」ページが残っていた。
表示は業務システムレベルだが、ボタンが何もしない／編集がリロードで消える状態。

対象 4 件を優先度順に実装した（ユーザー承認済みバックログ「全部順番に」）。

## ① 金額不整合確認（payments/mismatch）— 完了

- 静的モック行を撤去し、orderStore / paymentStore 購読のライブ算出に置換。
- 不整合判定は受注金額 vs 入金累計の突合（過入金 / 不足 / 一致）。
- 正規オーナーとして usePersistentStore を配線済み（domain: payments 系の既存枠）。

## ② 不良欠品処理（shipments/defective-shortage）— 完了

- 約470行のフル書き直し。defectiveStore / inventoryStore / orderStore 購読。
- 不良在庫起因の欠品受注を抽出し、代替引当・入荷待ち切替・キャンセル誘導を実装。
- defective ドメイン vitest 22/22 GREEN。

## ③ NP後払い / atone サポート（payments/np, payments/atone）— 完了

- 静的 ROWS → useState 行に変換。外部決済プロバイダ API 接続前提のため
  ストア横断 cascade は張らず、ページ内 immutable 遷移で実装（モック境界を明示）。
- NP: 同期（与信中→与信OK）/ 切替（与信NG→切替済）/ 催促（reminded 冪等フラグ）。
- atone: 上記に加え 貸倒処理（回収不能→貸倒処理済）。AT-001 シードを与信中に変更し
  同期ボタンの実効性を確保。
- 全デッドボタン解消。状態フィルタ「対応必要のみ」は実絞り込み。

## ④ テンプレート3画面の永続化（本コミット分）

### 問題
- 発注書テンプレート（purchasing/order-template）
- 出荷指示書テンプレート（shipments/instruction-template）
- 納品書テンプレート（shipments/delivery-note-template）

の3画面は既に共有ストア（documentTemplateStore / instructionTemplateStore /
deliveryNoteTemplateStore）の正規オーナーとして CRUD 配線済みだったが、
**永続化 v2（store_snapshots）に未接続**のため編集がフルリロードで消えていた。

### 実装
1. `SnapshotDomain` union に 3 リテラル追加:
   `"document-templates" | "instruction-templates" | "delivery-note-templates"`
   （`store_snapshots.domain` は plain text 列のため **DB マイグレーション不要**）
2. 各オーナーページ先頭で `usePersistentStore({ store, domain, seed })` を 1 回だけ呼ぶ
   （shipments/defective と同一パターン）。

### 非対象（設計判断）
- ストア / シード / server action は既存のまま（汎用 snapshotDomain/restoreDomain が
  domain パラメータで吸収）。
- restore 到着時に編集中ドラフトが seed 由来のまま残る微小ハザードは、
  他オーナーページと同じく許容（dirty 追跡の追加はオーバーエンジニアリングと判断）。

## 検証

- `npx vitest run`: 59 files / 682 tests 全 GREEN
- `npx tsc --noEmit`: クリーン
- 永続化ガードは既存の fail-closed（no-db / forbidden）をそのまま透過。

## 冪等性・セキュリティ

- snapshot は (workspace, domain) upsert で冪等。
- 認証なし永続化は `OMS_PERSIST_ALLOW_UNAUTHENTICATED==="1"` の明示オプトイン必須
  （reference_security_audit_v1 準拠、変更なし）。
