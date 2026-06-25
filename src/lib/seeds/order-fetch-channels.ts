/**
 * orderFetchChannelStore（受注取得APIチャネル一覧）の初期シード値。
 *
 * settings/api/order-fetch が正規オーナーとして空ストアにセットする初期データ。
 * 楽天・Yahoo!・Amazon・Shopify・au PAY マーケット・Qoo10 の6チャネル。
 *
 * v2 で server action + Drizzle に置き換えるまでの暫定。
 */

import type { OrderFetchChannelRecord } from "@/lib/stores/order-fetch-channels";

export const INITIAL_ORDER_FETCH_CHANNELS: OrderFetchChannelRecord[] = [
  {
    id: "rakuten",
    name: "楽天市場 受注取得API",
    endpoint: "/api/rakuten/orders",
    schedule: "15分間隔",
    lastRun: "2026/04/30 10:30",
    lastCount: 12,
    total24h: 245,
    errorCount: 0,
    status: "ok",
    shop: "楽天店",
    authExpires: "2026/12/31",
  },
  {
    id: "yahoo",
    name: "Yahoo!ショッピング 受注取得API",
    endpoint: "/api/yahoo/orders",
    schedule: "15分間隔",
    lastRun: "2026/04/30 10:30",
    lastCount: 5,
    total24h: 88,
    errorCount: 0,
    status: "ok",
    shop: "Yahoo!店",
    authExpires: "2026/10/15",
  },
  {
    id: "amazon",
    name: "Amazon 受注取得API",
    endpoint: "/api/amazon/orders",
    schedule: "30分間隔",
    lastRun: "2026/04/30 10:15",
    lastCount: 8,
    total24h: 124,
    errorCount: 1,
    status: "warning",
    shop: "Amazon店",
    authExpires: "2026/06/30",
  },
  {
    id: "shopify",
    name: "Shopify 自社EC 受注取得",
    endpoint: "/api/shopify/orders",
    schedule: "Webhookリアルタイム",
    lastRun: "2026/04/30 10:42",
    lastCount: 1,
    total24h: 980,
    errorCount: 0,
    status: "ok",
    shop: "本店",
    authExpires: "—",
  },
  {
    id: "aupay",
    name: "au PAY マーケット 受注取得API",
    endpoint: "/api/aupay/orders",
    schedule: "30分間隔",
    lastRun: "—",
    lastCount: 0,
    total24h: 0,
    errorCount: 0,
    status: "disabled",
    shop: "au PAY マーケット店",
    authExpires: "—",
  },
  {
    id: "qoo10",
    name: "Qoo10 受注取得API",
    endpoint: "/api/qoo10/orders",
    schedule: "60分間隔",
    lastRun: "2026/04/29 23:00",
    lastCount: 0,
    total24h: 12,
    errorCount: 4,
    status: "error",
    shop: "Qoo10店",
    authExpires: "2026/05/15",
  },
];
