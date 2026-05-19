-- v1: orderStore snapshot/restore のための単一テーブル
-- workspace カラムで複数テナント拡張に備えるが、現状は 'default' 固定
CREATE TABLE IF NOT EXISTS "order_snapshots" (
  "workspace" text PRIMARY KEY NOT NULL,
  "data" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
