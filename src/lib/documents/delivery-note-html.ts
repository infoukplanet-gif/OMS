/**
 * 納品書ドキュメントを印刷可能な standalone HTML 文字列に変換する。
 *
 * 純粋関数・Date-free。プレビュー（iframe srcDoc）と印刷ウィンドウが
 * 同一 HTML を共有する。動的値はすべて escapeHtml で無害化（XSS防止）。
 */

import type { DeliveryNoteDocument } from "@/lib/documents/delivery-note-document";
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

export function renderDeliveryNoteHtml(
  doc: DeliveryNoteDocument,
  issuer: CompanyIssuer,
): string {
  const landscape = doc.paperSize === "A4横" || doc.paperSize === "B5横";
  const isB5 = doc.paperSize === "B5" || doc.paperSize === "B5横";
  const pageSize = isB5
    ? landscape ? "B5 landscape" : "B5 portrait"
    : landscape ? "A4 landscape" : "A4 portrait";

  const logoBlock = doc.showLogo
    ? `<div class="logo">${escapeHtml(issuer.name)}</div>`
    : "";

  const invoiceBlock = doc.showInvoice
    ? `<div class="invoice-no">適格請求書発行事業者番号: ${escapeHtml(issuer.invoiceNo)}</div>`
    : "";

  const rows = doc.lines
    .map((line, i) => {
      const unit = line.unitPrice !== null ? yen(line.unitPrice) : "—";
      const amount = line.amount !== null ? yen(line.amount) : "—";
      const priceCell = doc.showPriceBreakdown
        ? `<td class="num">${unit}</td><td class="num">${amount}</td>`
        : "";
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="small mono">${escapeHtml(line.sku)}</td>
        <td>${escapeHtml(line.name)}</td>
        <td class="num">${line.qty.toLocaleString("en-US")}</td>
        ${priceCell}
      </tr>`;
    })
    .join("");

  const priceHeaders = doc.showPriceBreakdown
    ? `<th class="num">単価</th><th class="num">金額</th>`
    : "";

  const totalsBlock = doc.showPriceBreakdown
    ? `<div class="totals">
        <div class="totals-inner">
          <div class="total-row"><span>小計</span><span>${yen(doc.subtotal)}</span></div>
          <div class="total-row"><span>消費税（${Math.round(doc.taxRate * 100)}%）</span><span>${yen(doc.tax ?? 0)}</span></div>
          <div class="total-row grand"><span>合計</span><span>${yen(doc.total)}</span></div>
        </div>
      </div>`
    : `<div class="totals"><div class="totals-inner"><div class="total-row grand"><span>合計</span><span>${yen(doc.total)}</span></div></div></div>`;

  const signatureBlock = doc.showSignature
    ? `<div class="sign-box">担当者印</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>納品書 ${escapeHtml(doc.documentNo)}</title>
<style>
  @page { size: ${pageSize}; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    color: #1f2937; margin: 0; padding: 24px; font-size: 13px; line-height: 1.6;
  }
  .sheet { max-width: ${landscape ? "1000px" : "720px"}; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  h1 { font-size: 26px; letter-spacing: 0.3em; margin: 0 0 4px; font-weight: 700; }
  .doc-no { color: #6b7280; font-size: 12px; }
  .logo { font-weight: 700; font-size: 14px; padding: 8px 14px; border: 1.5px solid #1f2937; border-radius: 6px; white-space: nowrap; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 16px; }
  .customer { font-size: 18px; font-weight: 600; border-bottom: 2px solid #1f2937; padding-bottom: 6px; min-width: 200px; }
  .customer small { display: block; font-size: 11px; color: #6b7280; font-weight: 400; margin-top: 4px; }
  .issuer { text-align: right; font-size: 11px; color: #374151; line-height: 1.5; }
  .issuer .name { font-size: 13px; font-weight: 600; color: #1f2937; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 12px 0 16px; font-size: 12px; }
  .meta-row { display: flex; gap: 10px; }
  .meta-label { color: #6b7280; min-width: 80px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-size: 11px; color: #374151; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.small { font-size: 10px; }
  td.mono { font-family: monospace; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-inner { min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 5px 10px; font-size: 13px; }
  .total-row.grand { border-top: 2px solid #1f2937; font-weight: 700; font-size: 15px; margin-top: 2px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; }
  .invoice-no { font-size: 11px; color: #6b7280; }
  .sign-box { width: 80px; height: 80px; border: 1.5px dashed #9ca3af; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>納品書</h1>
        <div class="doc-no">受注番号: ${escapeHtml(doc.documentNo)}</div>
        <div class="doc-no">発行日: ${escapeHtml(doc.issueDate)}</div>
      </div>
      ${logoBlock}
    </div>

    <div class="parties">
      <div class="customer">
        ${escapeHtml(doc.customerName)} 様
        <small>お届け先</small>
      </div>
      <div class="issuer">
        <div class="name">${escapeHtml(issuer.name)}</div>
        <div>〒${escapeHtml(issuer.postalCode)}</div>
        <div>${escapeHtml(issuer.address)}</div>
        <div>TEL: ${escapeHtml(issuer.tel)}</div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-row"><span class="meta-label">出荷日</span><span>${escapeHtml(doc.shipDate)}</span></div>
      <div class="meta-row"><span class="meta-label">配送業者</span><span>${escapeHtml(doc.carrier)}</span></div>
      <div class="meta-row"><span class="meta-label">販売店舗</span><span>${escapeHtml(doc.shop)}</span></div>
      <div class="meta-row"><span class="meta-label">用途区分</span><span>${escapeHtml(doc.forUse)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>SKU</th>
          <th>商品名</th>
          <th class="num">数量</th>
          ${priceHeaders}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    ${totalsBlock}

    <div class="footer">
      ${invoiceBlock}
      ${signatureBlock}
    </div>
  </div>
</body>
</html>`;
}
