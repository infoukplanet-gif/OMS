/**
 * 楽天カード決済確定ページの初期シード（オーソリ済受注）。
 *
 * 永続化（domain: "rakuten-card-rows"）の正規オーナーページは
 * src/app/payments/rakuten-card/page.tsx。
 */

import type { CardAuthorizationRecord } from "../state-machines/card-authorization";

export const INITIAL_RAKUTEN_CARD_ROWS: CardAuthorizationRecord[] = [
  { id: "RC-001", order: "ORD-2026-00851", customer: "山田太郎", amount: 32400, authAt: "2026-04-25", authExpire: "2026-05-25", daysToExpire: 30, status: "売上確定待ち" },
  { id: "RC-002", order: "ORD-2026-00845", customer: "高橋健", amount: 22800, authAt: "2026-04-24", authExpire: "2026-05-24", daysToExpire: 29, status: "売上確定待ち" },
  { id: "RC-003", order: "ORD-2026-00838", customer: "井上智", amount: 28500, authAt: "2026-04-23", authExpire: "2026-05-23", daysToExpire: 28, status: "売上確定済" },
  { id: "RC-004", order: "ORD-2026-00824", customer: "佐藤花子", amount: 38400, authAt: "2026-04-22", authExpire: "2026-05-22", daysToExpire: 27, status: "売上確定待ち" },
  { id: "RC-005", order: "ORD-2026-00802", customer: "中村あかり", amount: 12800, authAt: "2026-03-30", authExpire: "2026-04-29", daysToExpire: 4, status: "売上確定待ち" },
];
