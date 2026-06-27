/**
 * RSL（楽天スーパーロジスティクス）出荷処理キューのシード。
 *
 * 楽天店受注をRSLへ委託した出荷指示の進捗ログ。失敗の再送・保留分の即時送信で
 * status が遷移するため、共有ストア（rsl-outbound-store）+ usePersistentStore で永続化する。
 * オーナーは warehouse-integration/rakuten-super-logi/outbound ページ。
 */

export type RslOutboundStatus =
  | "指示送信"
  | "ピッキング中"
  | "梱包中"
  | "発送済"
  | "保留"
  | "失敗";

export interface RslOutbound {
  id: string;
  orderNo: string;
  customer: string;
  zipPrefix: string;
  items: number;
  qty: number;
  cutoff: string;
  shippedAt: string;
  carrier: string;
  trackingNo: string;
  status: RslOutboundStatus;
  shop: string;
  [extra: string]: unknown;
}

export const INITIAL_RSL_OUTBOUND: RslOutbound[] = [
  { id: "RSL-OUT-20260430-0145", orderNo: "ORD-2026-08423", customer: "田中 太郎", zipPrefix: "100", items: 2, qty: 3, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "ピッキング中", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0144", orderNo: "ORD-2026-08418", customer: "山田 花子", zipPrefix: "150", items: 1, qty: 1, cutoff: "2026/04/30 12:00", shippedAt: "2026/04/30 10:30", carrier: "ヤマト", trackingNo: "1234-5678-9012", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0143", orderNo: "ORD-2026-08410", customer: "佐藤 一郎", zipPrefix: "060", items: 3, qty: 5, cutoff: "2026/04/30 12:00", shippedAt: "2026/04/30 10:15", carrier: "ヤマト", trackingNo: "2345-6789-0123", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0142", orderNo: "ORD-2026-08405", customer: "渡辺 美咲", zipPrefix: "530", items: 1, qty: 2, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "梱包中", shop: "楽天店" },
  { id: "RSL-OUT-20260430-0141", orderNo: "ORD-2026-08400", customer: "木村 健", zipPrefix: "812", items: 2, qty: 2, cutoff: "2026/04/30 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "指示送信", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0418", orderNo: "ORD-2026-08398", customer: "伊藤 さくら", zipPrefix: "900", items: 1, qty: 1, cutoff: "2026/04/29 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "保留", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0417", orderNo: "ORD-2026-08395", customer: "小林 大輔", zipPrefix: "240", items: 2, qty: 4, cutoff: "2026/04/29 12:00", shippedAt: "2026/04/29 16:00", carrier: "ヤマト", trackingNo: "3456-7890-1234", status: "発送済", shop: "楽天店" },
  { id: "RSL-OUT-20260429-0416", orderNo: "ORD-2026-08390", customer: "吉田 あゆみ", zipPrefix: "950", items: 1, qty: 1, cutoff: "2026/04/29 12:00", shippedAt: "—", carrier: "—", trackingNo: "—", status: "失敗", shop: "楽天店" },
];
