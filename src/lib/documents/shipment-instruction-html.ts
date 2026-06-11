/**
 * 出荷指示書ドキュメントを印刷可能な standalone HTML 文字列に変換する。
 *
 * 純粋関数・Date-free。プレビュー（iframe srcDoc）と印刷ウィンドウが
 * 同一 HTML を共有することで描画のズレを防ぐ。
 * 動的値はすべて escapeHtml で無害化する（XSS防止）。
 */

import type { ShipmentInstructionDocument } from "@/lib/documents/shipment-instruction-document";
import type { CompanyIssuer } from "@/lib/seeds/company";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function yen(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(Math.round(n)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}¥${grouped}`;
}

export function renderShipmentInstructionHtml(
  doc: ShipmentInstructionDocument,
  issuer: CompanyIssuer,
): string {
  const landscape = doc.paperSize === "A4横";
  const pageSize = landscape ? "A4 landscape" : "A4 portrait";

  const barcodeBlock = doc.showBarcode
    ? `<div class="barcode-area"><span class="barcode-label">▐ ${escapeHtml(doc.documentNo)} ▌</span><div class="barcode-hint">バーコード印字エリア</div></div>`
    : "";

  const trackingRow = doc.trackingNumber
    ? `<div class="meta-row"><span class="meta-label">追跡番号</span><span class="meta-value mono">${escapeHtml(doc.trackingNumber)}</span></div>`
    : "";

  const locationHeader = doc.showLocation ? `<th class="num">ロケ</th>` : "";
  const lotHeader = doc.showLot ? `<th>ロット</th>` : "";

  const rows = doc.lines
    .map((line, i) => {
      const locationCell = doc.showLocation
        ? `<td class="num">${escapeHtml(line.location ?? "—")}</td>`
        : "";
      const lotCell = doc.showLot
        ? `<td class="mono small">${escapeHtml(line.lot ?? "—")}</td>`
        : "";
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="mono small">${escapeHtml(line.sku)}</td>
        <td>${escapeHtml(line.name)}</td>
        ${locationHeader ? locationCell : ""}
        ${lotHeader ? lotCell : ""}
        <td class="num bold">${line.qty.toLocaleString("en-US")}</td>
        <td class="num check-box"></td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>出荷指示書 ${escapeHtml(doc.documentNo)}</title>
<style>
  @page { size: ${pageSize}; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    color: #1f2937; margin: 0; padding: 20px; font-size: 12px; line-height: 1.5;
  }
  .sheet { max-width: ${landscape ? "1000px" : "720px"}; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #1f2937; padding-bottom: 12px; }
  h1 { font-size: 22px; letter-spacing: 0.2em; margin: 0 0 4px; font-weight: 700; }
  .doc-no { color: #374151; font-size: 11px; }
  .issuer-block { text-align: right; font-size: 11px; color: #374151; }
  .issuer-name { font-size: 13px; font-weight: 600; color: #1f2937; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 14px; }
  .meta-row { display: flex; gap: 10px; align-items: baseline; }
  .meta-label { color: #6b7280; min-width: 80px; font-size: 11px; }
  .meta-value { font-weight: 600; font-size: 12px; }
  .meta-value.mono { font-family: monospace; }
  .barcode-area { text-align: center; padding: 8px 16px; border: 1.5px dashed #9ca3af; border-radius: 6px; margin-bottom: 14px; background: #f9fafb; }
  .barcode-label { font-family: "Libre Barcode 39", monospace; font-size: 32px; letter-spacing: 4px; display: block; }
  .barcode-hint { font-size: 9px; color: #9ca3af; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: middle; }
  th { background: #f3f4f6; font-size: 10px; color: #374151; font-weight: 600; white-space: nowrap; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.mono, .mono { font-family: monospace; }
  td.small, .small { font-size: 10px; }
  td.bold { font-weight: 700; font-size: 14px; }
  td.check-box { width: 48px; }
  .totals-row { display: flex; justify-content: flex-end; gap: 24px; font-size: 12px; padding-top: 4px; }
  .total-item { display: flex; gap: 8px; }
  .total-label { color: #6b7280; }
  .total-value { font-weight: 700; }
  .footer { margin-top: 20px; display: flex; justify-content: flex-end; gap: 24px; }
  .sign-box { width: 80px; height: 72px; border: 1.5px dashed #9ca3af; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>出荷指示書</h1>
        <div class="doc-no">受注番号: ${escapeHtml(doc.documentNo)}</div>
        <div class="doc-no">発行日: ${escapeHtml(doc.issueDate)}</div>
      </div>
      <div class="issuer-block">
        <div class="issuer-name">${escapeHtml(issuer.name)}</div>
        <div>〒${escapeHtml(issuer.postalCode)}</div>
        <div>${escapeHtml(issuer.address)}</div>
        <div>TEL: ${escapeHtml(issuer.tel)}</div>
      </div>
    </div>

    ${barcodeBlock}

    <div class="meta-grid">
      <div class="meta-row">
        <span class="meta-label">宛先</span>
        <span class="meta-value">${escapeHtml(doc.customerName)} 様</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">出荷予定日</span>
        <span class="meta-value">${escapeHtml(doc.shipDate)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">配送業者</span>
        <span class="meta-value">${escapeHtml(doc.carrier)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">店舗</span>
        <span class="meta-value">${escapeHtml(doc.shop)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">入庫倉庫</span>
        <span class="meta-value">${escapeHtml(doc.forWarehouse)}</span>
      </div>
      ${trackingRow}
    </div>

    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>SKU</th>
          <th>商品名</th>
          ${doc.showLocation ? '<th class="num">ロケ</th>' : ""}
          ${doc.showLot ? "<th>ロット</th>" : ""}
          <th class="num">数量</th>
          <th class="num">ピック確認</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals-row">
      <div class="total-item">
        <span class="total-label">合計点数</span>
        <span class="total-value">${doc.totalItems.toLocaleString("en-US")} 点</span>
      </div>
      <div class="total-item">
        <span class="total-label">合計金額</span>
        <span class="total-value">${yen(doc.totalAmount)}</span>
      </div>
    </div>

    <div class="footer">
      <div class="sign-box">確認印</div>
      <div class="sign-box">梱包印</div>
    </div>
  </div>
</body>
</html>`;
}
