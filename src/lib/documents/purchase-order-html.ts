/**
 * 発注書ドキュメント（PurchaseOrderDocument）を印刷可能な standalone HTML 文字列に変換する。
 *
 * 純粋関数・Date-free。発注書発行モーダルのプレビュー（iframe srcDoc）と、
 * 印刷ウィンドウ（window.open → print）が同一の HTML を共有することで描画のズレを防ぐ。
 *
 * テンプレートの表示フラグ（ロゴ/インボイス/社印/税内訳）と言語・用紙サイズを
 * そのままレイアウトに反映する。動的値はすべて escapeHtml で無害化する（XSS防止）。
 */

import type { PurchaseOrderDocument } from "@/lib/documents/purchase-order-document";
import type { CompanyIssuer } from "@/lib/seeds/company";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 決定的な3桁区切り（toLocaleString のロケール差を避ける）。 */
function yen(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(Math.round(n)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}¥${grouped}`;
}

export function renderPurchaseOrderHtml(
  doc: PurchaseOrderDocument,
  issuer: CompanyIssuer,
): string {
  const L = doc.labels;
  const landscape = doc.paperSize === "A4横";
  const pageSize = landscape ? "A4 landscape" : "A4 portrait";

  const logoBlock = doc.showLogo
    ? `<div class="logo">${escapeHtml(issuer.name)}</div>`
    : "";

  const expectedRow = doc.expectedDate
    ? `<div class="meta-row"><span class="meta-label">${escapeHtml(L.expected)}</span><span>${escapeHtml(doc.expectedDate)}</span></div>`
    : "";

  const rows = doc.lines
    .map((line, i) => {
      const unit = line.unitPrice !== null ? yen(line.unitPrice) : "—";
      const amount = line.amount !== null ? yen(line.amount) : "—";
      return `<tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(line.name)}<div class="sku">${escapeHtml(line.sku)}</div></td>
        <td>${line.warehouse ? escapeHtml(line.warehouse) : "—"}</td>
        <td class="num">${line.quantity.toLocaleString("en-US")}</td>
        <td class="num">${unit}</td>
        <td class="num">${amount}</td>
      </tr>`;
    })
    .join("");

  const totalsRows = doc.showTaxBreakdown
    ? `<div class="total-row"><span>${escapeHtml(L.subtotal)}</span><span>${yen(doc.subtotal)}</span></div>
       <div class="total-row"><span>${escapeHtml(L.tax)}（${Math.round(doc.taxRate * 100)}%）</span><span>${yen(doc.tax ?? 0)}</span></div>
       <div class="total-row grand"><span>${escapeHtml(L.total)}</span><span>${yen(doc.total)}</span></div>`
    : `<div class="total-row grand"><span>${escapeHtml(L.total)}</span><span>${yen(doc.total)}</span></div>`;

  const invoiceBlock = doc.showInvoice
    ? `<div class="issuer-row">${escapeHtml(L.invoiceNo)}: ${escapeHtml(issuer.invoiceNo)}</div>`
    : "";

  const signatureBlock = doc.showSignature
    ? `<div class="signature"><div class="signature-box">${escapeHtml(L.signature)}</div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${doc.language === "English" ? "en" : doc.language === "中文" ? "zh" : "ja"}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)} ${escapeHtml(doc.documentNo)}</title>
<style>
  @page { size: ${pageSize}; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    color: #1f2937; margin: 0; padding: 24px; font-size: 13px; line-height: 1.6;
  }
  .sheet { max-width: ${landscape ? "1000px" : "720px"}; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  h1 { font-size: 26px; letter-spacing: 0.3em; margin: 0 0 4px; font-weight: 700; }
  .doc-no { color: #6b7280; font-size: 12px; }
  .logo {
    font-weight: 700; font-size: 14px; padding: 8px 14px;
    border: 1.5px solid #1f2937; border-radius: 6px; white-space: nowrap;
  }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
  .supplier { font-size: 16px; font-weight: 600; border-bottom: 2px solid #1f2937; padding-bottom: 6px; min-width: 240px; }
  .supplier small { display: block; font-size: 11px; color: #6b7280; font-weight: 400; margin-top: 4px; }
  .issuer { text-align: right; font-size: 11px; color: #374151; line-height: 1.5; }
  .issuer .name { font-size: 13px; font-weight: 600; color: #1f2937; }
  .meta { margin: 14px 0 18px; font-size: 12px; }
  .meta-row { display: flex; gap: 12px; }
  .meta-label { color: #6b7280; min-width: 88px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #d1d5db; padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-size: 11px; color: #374151; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .sku { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  .totals { display: flex; justify-content: flex-end; }
  .totals-inner { min-width: 260px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 10px; font-size: 13px; }
  .total-row.grand { border-top: 2px solid #1f2937; font-weight: 700; font-size: 15px; margin-top: 2px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; }
  .issuer-row { font-size: 11px; color: #6b7280; }
  .signature { margin-left: auto; }
  .signature-box {
    width: 84px; height: 84px; border: 1.5px dashed #9ca3af; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af; text-align: center;
  }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${escapeHtml(doc.title)}</h1>
        <div class="doc-no">${escapeHtml(L.documentNo)}: ${escapeHtml(doc.documentNo)}</div>
        <div class="doc-no">${escapeHtml(L.issueDate)}: ${escapeHtml(doc.issueDate)}</div>
      </div>
      ${logoBlock}
    </div>

    <div class="parties">
      <div class="supplier">
        ${escapeHtml(doc.supplierName)} 御中
        <small>${escapeHtml(L.supplier)}</small>
      </div>
      <div class="issuer">
        <div class="name">${escapeHtml(issuer.name)}</div>
        <div>〒${escapeHtml(issuer.postalCode)}</div>
        <div>${escapeHtml(issuer.address)}</div>
        <div>TEL: ${escapeHtml(issuer.tel)}</div>
      </div>
    </div>

    <div class="meta">
      ${expectedRow}
    </div>

    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>${escapeHtml(L.item)}</th>
          <th>${escapeHtml(L.warehouse)}</th>
          <th class="num">${escapeHtml(L.quantity)}</th>
          <th class="num">${escapeHtml(L.unitPrice)}</th>
          <th class="num">${escapeHtml(L.amount)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-inner">
        ${totalsRows}
      </div>
    </div>

    <div class="footer">
      ${invoiceBlock}
      ${signatureBlock}
    </div>
  </div>
</body>
</html>`;
}
