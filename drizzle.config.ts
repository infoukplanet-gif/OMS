import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit 設定。
 *
 * 使い方:
 *   npm run db:generate  → migration ファイル生成（schema.ts の変更を SQL に）
 *   npm run db:push      → 開発時に schema を直接 push（migration 飛ばす）
 *   npm run db:migrate   → 生成済み migration を適用
 *
 * DATABASE_URL を .env に設定してから実行。
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
