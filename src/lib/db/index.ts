/**
 * Drizzle DB クライアント。
 *
 * DATABASE_URL 未設定時は null を返し、server action 側でフォールバックする。
 * これにより:
 *  - .env 未設定でも UI は in-memory seed で動く（dev / e2e の継続性）
 *  - DATABASE_URL を設定するだけで自動的に永続化が有効になる
 *
 * 接続は Neon HTTP driver を使用。Edge / Fluid Compute いずれでも動く。
 */

import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let cached: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> | null {
  if (cached !== null) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  cached = drizzle(neon(url), { schema });
  return cached;
}

export { schema };
