-- v2: 全ドメイン共通の store snapshot/restore テーブルに統一
--
-- v1 の order_snapshots（orders 専用・workspace 単独 PK）を廃止し、
-- (workspace, domain) 複合 PK の store_snapshots に置き換える。
-- 1 ストア = 1 行（domain で orders / inventory / payments / ... を区別）。
--
-- 永続化は opt-in（DATABASE_URL 設定時のみ）で本番データは無いため、
-- v1 テーブルは移行せず DROP する。
DROP TABLE IF EXISTS "order_snapshots";

CREATE TABLE IF NOT EXISTS "store_snapshots" (
  "workspace" text NOT NULL,
  "domain" text NOT NULL,
  "data" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "store_snapshots_workspace_domain_pk" PRIMARY KEY ("workspace", "domain")
);
