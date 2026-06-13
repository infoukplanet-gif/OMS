/**
 * ダウンロードウィザード各ページの「実データ行ビルダー」。
 *
 * DownloadWizard は列定義（exampleColumns）だけでは中身が空の CSV しか出せなかった。
 * このモジュールは各ダウンロードページの列定義と、共有シード（INITIAL_ORDERS /
 * INITIAL_SHIPMENTS / INITIAL_PURCHASE_ORDERS）から実データ行を生成するビルダーを
 * 1 組にして公開する。列とビルダーを同じ場所で定義することで列順とセル順の整合を保証する。
 *
 * - in-memory store はフルリロードで初期化されるため、ダウンロードは常にデータが
 *   存在するシード定数を出力元にする（store ではなく seed を読む）。
 * - フィルタ（店舗/仕入先/ステータス）と対象期間は実際に出力行へ反映される。
 * - シードに無いフィールド（住所・送料等）は捏造せず空欄で出力する（正直な空欄）。
 *
 * すべて pure（DOM 非依存）。DownloadWizard の buildRows プロップへ渡す。
 */

import { INITIAL_ORDERS, type OrderSeed } from "@/lib/seeds/orders";
import { INITIAL_SHIPMENTS, type SeededShipment } from "@/lib/seeds/shipments";
import { INITIAL_PURCHASE_ORDERS } from "@/lib/seeds/purchase-orders";
import type { DownloadRowContext } from "@/components/download/download-wizard";
import type { CsvCell } from "@/lib/export/csv";

export type DownloadRowBuilder = (ctx: DownloadRowContext) => CsvCell[][];

/** 列定義とビルダーを 1 組にしたダウンロード定義。 */
export interface DownloadDataset {
  columns: string[];
  buildRows: DownloadRowBuilder;
}

// ---- 数値・日付ヘルパ ----------------------------------------------------

const TAX_RATE = 1.1;
/** 税込金額から税抜金額を求める（10% 内税前提、四捨五入）。 */
const taxExclusive = (amount: number): number => Math.round(amount / TAX_RATE);
/** 税込金額に含まれる消費税額。 */
const taxOf = (amount: number): number => amount - taxExclusive(amount);

/** "2026/05/02" | "2026/04/30 10:42" | "2026-05-10" → "2026-05-02"。 */
function toIsoDate(raw: string): string {
  const datePart = raw.trim().split(/\s+/)[0] ?? "";
  return datePart.replace(/\//g, "-");
}

const startOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const endOfDay = (d: Date): number =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

/** 対象期間フィルタ。未確定日付（"—"等）は除外しない（漏れより冗長を優先）。 */
function withinRange(raw: string, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  const t = Date.parse(toIsoDate(raw));
  if (Number.isNaN(t)) return true;
  if (from && t < startOfDay(from)) return false;
  if (to && t > endOfDay(to)) return false;
  return true;
}

// ---- フィルタヘルパ ------------------------------------------------------

/** 「すべて」「全〜」は絞り込みなしとみなす。 */
function isAll(value?: string): boolean {
  return !value || value === "すべて" || value.startsWith("全");
}

/** 部分一致（双方向）。店舗名の表記ゆれ（楽天市場↔楽天店）を吸収する。 */
function matches(fieldValue: string, selected?: string): boolean {
  if (isAll(selected)) return true;
  return fieldValue.includes(selected!) || selected!.includes(fieldValue);
}

/** 候補キーのうち最初に「すべて」でない選択値を返す（ページごとのキー差を吸収）。 */
function pickFilter(filters: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = filters[key];
    if (value && !isAll(value)) return value;
  }
  return undefined;
}

// ---- 受注クロス参照 ------------------------------------------------------

const orderById = new Map<string, OrderSeed>(INITIAL_ORDERS.map((o) => [o.id, o]));

const warehouseOf = (orderId: string): string =>
  orderById.get(orderId)?.allocation?.[0]?.warehouse ?? "";
const paymentOf = (orderId: string): string => orderById.get(orderId)?.payment ?? "";
const orderDateOf = (orderId: string): string => {
  const o = orderById.get(orderId);
  return o ? toIsoDate(o.date) : "";
};
const customerCodeOf = (orderId: string): string => orderById.get(orderId)?.customerCode ?? "";
/** 代引金額（支払方法が代金引換の出荷のみ金額、他は 0）。 */
const codAmountOf = (s: SeededShipment): number =>
  paymentOf(s.id) === "代金引換" ? s.amount : 0;

/** 実際に出荷された出荷ステータス（出荷通知・PDF・完了報告で対象にする）。 */
const SHIPPED_STATUSES = new Set(["出荷済み", "配送中", "配達完了"]);

/** 出荷シードを期間・店舗で絞る共通フィルタ。 */
function filterShipments(
  ctx: DownloadRowContext,
  opts: { shippedOnly?: boolean; excludeCancelled?: boolean } = {},
): SeededShipment[] {
  const shop = pickFilter(ctx.filters, ["mall", "shop", "channel"]);
  return INITIAL_SHIPMENTS.filter((s) => {
    if (opts.shippedOnly && !SHIPPED_STATUSES.has(s.status)) return false;
    if (opts.excludeCancelled && s.status === "キャンセル") return false;
    if (!withinRange(s.shipDate, ctx.from, ctx.to)) return false;
    if (!matches(s.shop, shop)) return false;
    return true;
  });
}

// ---- ページ別データセット ------------------------------------------------

/** 出荷実績ダウンロード（shipments/sales-download）。 */
export const salesDownload: DownloadDataset = {
  columns: [
    "売上計上日", "受注番号", "受注日", "発送日", "顧客コード", "顧客名", "モール",
    "商品コード", "商品名", "数量", "税抜金額", "税額", "税込金額", "送料", "手数料",
    "値引額", "支払方法",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { excludeCancelled: true }).map((s) => [
      toIsoDate(s.shipDate), s.id, orderDateOf(s.id), toIsoDate(s.shipDate),
      customerCodeOf(s.id), s.customer, s.shop, "", "", s.items,
      taxExclusive(s.amount), taxOf(s.amount), s.amount, "", "", "", paymentOf(s.id),
    ]),
};

/** 発注書ダウンロード（purchasing/order-download）。 */
export const purchaseOrderDownload: DownloadDataset = {
  columns: [
    "発注番号", "発注日", "仕入先名", "担当者", "品目数", "小計", "税額", "合計",
    "入荷予定日", "支払期日", "備考",
  ],
  buildRows: (ctx) => {
    const supplier = pickFilter(ctx.filters, ["supplier"]);
    const status = pickFilter(ctx.filters, ["status"]);
    return INITIAL_PURCHASE_ORDERS.filter(
      (po) =>
        withinRange(po.date, ctx.from, ctx.to) &&
        matches(po.supplier, supplier) &&
        matches(po.status, status),
    ).map((po) => [
      po.id, toIsoDate(po.date), po.supplier, "", po.items,
      taxExclusive(po.amount), taxOf(po.amount), po.amount,
      po.expected === "—" ? "" : toIsoDate(po.expected), "", po.status,
    ]);
  },
};

/** 分析CSVダウンロード（analytics/csv-download）= 売上明細。 */
export const analyticsCsvDownload: DownloadDataset = {
  columns: [
    "日付", "店舗", "チャネル", "商品コード", "商品名", "カテゴリ", "数量", "売上金額",
    "原価", "粗利", "粗利率", "返品数", "決済方法", "顧客区分",
  ],
  buildRows: (ctx) => {
    const shop = pickFilter(ctx.filters, ["shop", "channel", "mall"]);
    return INITIAL_ORDERS.filter(
      (o) => withinRange(o.date, ctx.from, ctx.to) && matches(o.shop, shop),
    ).map((o) => [
      toIsoDate(o.date), o.shop, o.shop, o.allocation?.[0]?.sku ?? "", "", "",
      o.items, o.amount, "", "", "", 0, o.payment, o.customerCode ? "卸売" : "個人",
    ]);
  },
};

/** 配送ステータス変更ダウンロード（shipments/status-download）。 */
export const statusDownload: DownloadDataset = {
  columns: [
    "受注番号", "現ステータス", "ステータス更新日時", "受注日", "出荷予定日", "顧客名",
    "倉庫", "配送業者", "追跡番号", "遅延日数", "保留理由",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx).map((s) => [
      s.id, s.status, toIsoDate(s.shipDate), orderDateOf(s.id), toIsoDate(s.shipDate),
      s.customer, warehouseOf(s.id), s.carrier, (s.trackingNumber as string) ?? "", 0, "",
    ]),
};

/** 出荷通知ダウンロード（shipments/notification-download）。 */
export const notificationDownload: DownloadDataset = {
  columns: [
    "モール受注番号", "店舗内受注番号", "出荷日", "配送業者", "追跡番号", "送付先氏名",
    "個口数", "備考", "ステータス",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { shippedOnly: true }).map((s) => [
      s.id, s.id, toIsoDate(s.shipDate), s.carrier, (s.trackingNumber as string) ?? "",
      s.customer, 1, "", s.status,
    ]),
};

/** 配送情報ダウンロード（shipments/info-download）。 */
export const infoDownload: DownloadDataset = {
  columns: [
    "受注番号", "出荷日", "送付先氏名", "送付先郵便番号", "送付先住所", "送付先電話",
    "配送業者", "配送方法", "追跡番号", "代引金額", "送料", "個口数", "重量", "サイズ",
    "倉庫コード", "出荷指示者", "備考",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { excludeCancelled: true }).map((s) => [
      s.id, toIsoDate(s.shipDate), s.customer, "", "", "", s.carrier, "宅配便",
      (s.trackingNumber as string) ?? "", codAmountOf(s), "", 1, "", "",
      warehouseOf(s.id), "", "",
    ]),
};

/** 発送完了報告ダウンロード（shipments/completion-report）。 */
export const completionReport: DownloadDataset = {
  columns: [
    "発送日", "受注番号", "配送業者", "倉庫", "モール", "顧客名", "金額", "送料",
    "代引金額", "完了時刻", "リードタイム", "備考",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { shippedOnly: true }).map((s) => [
      toIsoDate(s.shipDate), s.id, s.carrier, warehouseOf(s.id), s.shop, s.customer,
      s.amount, "", codAmountOf(s), "", "", "",
    ]),
};

/** 納品書・出荷指示書ダウンロード（shipments/documents）。 */
export const documentsDownload: DownloadDataset = {
  columns: [
    "受注番号", "書類種別", "発行日", "顧客名", "宛名", "金額", "税額", "インボイス番号",
    "発行者", "ファイル名",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { excludeCancelled: true }).map((s) => [
      s.id, "納品書", toIsoDate(s.shipDate), s.customer, `${s.customer} 様`,
      s.amount, taxOf(s.amount), "", "", `${s.id}_納品書.pdf`,
    ]),
};

/** 納品書・出荷指示書PDF複数ダウンロード（shipments/pdf-bulk）。 */
export const pdfBulkDownload: DownloadDataset = {
  columns: [
    "受注番号", "顧客名", "送付先住所", "発送日", "配送業者", "追跡番号", "金額", "個口数",
  ],
  buildRows: (ctx) =>
    filterShipments(ctx, { shippedOnly: true }).map((s) => [
      s.id, s.customer, "", toIsoDate(s.shipDate), s.carrier,
      (s.trackingNumber as string) ?? "", s.amount, 1,
    ]),
};
