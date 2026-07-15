/**
 * 注文請書ドキュメント（OrderAcknowledgementDocument）を印刷可能な standalone HTML 文字列に変換する。
 *
 * 純粋関数・Date-free。受注詳細ページの印刷ボタンが window.open → print で使う。
 * 動的値はすべて escapeHtml で無害化する（XSS防止）。
 */

import type { OrderAcknowledgementDocument } from "@/lib/documents/order-acknowledgement-document";
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

export function renderOrderAcknowledgementHtml(
  doc: OrderAcknowledgementDocument,
  issuer: CompanyIssuer,
): string {
  const rows = doc.lines
    .map(
      (line, i) => `<tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(line.name)}<div class="sku">${escapeHtml(line.sku)}</div></td>
        <td class="num">${yen(line.unitPrice)}</td>
        <td class="num">${line.qty.toLocaleString("en-US")}</td>
        <td class="num">${yen(line.amount)}</td>
      </tr>`,
    )
    .join("");

  const shippingRow =
    doc.shippingFee > 0
      ? `<div class="total-row"><span>送料</span><span>${yen(doc.shippingFee)}</span></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(doc.title)} ${escapeHtml(doc.documentNo)}</title>
<style>
  @page { size: A4 portrait; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif;
    color: #1f2937; margin: 0; padding: 24px; font-size: 13px; line-height: 1.6;
  }
  .sheet { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  h1 { font-size: 26px; letter-spacing: 0.3em; margin: 0 0 4px; font-weight: 700; }
  .doc-no { color: #6b7280; font-size: 12px; }
  .lead { font-size: 12px; color: #374151; margin: 4px 0 18px; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
  .customer { font-size: 16px; font-weight: 600; border-bottom: 2px solid #1f2937; padding-bottom: 6px; min-width: 240px; }
  .customer small { display: block; font-size: 11px; color: #6b7280; font-weight: 400; margin-top: 4px; }
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
  .note { font-size: 11px; color: #6b7280; max-width: 360px; }
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
        <div class="doc-no">受注番号: ${escapeHtml(doc.documentNo)}</div>
        <div class="doc-no">発行日: ${escapeHtml(doc.issueDate)}</div>
      </div>
      <div class="logo">${escapeHtml(issuer.name)}</div>
    </div>

    <div class="parties">
      <div class="customer">
        ${escapeHtml(doc.customerName)} 御中
        <small>ご注文者</small>
      </div>
      <div class="issuer">
        <div class="name">${escapeHtml(issuer.name)}</div>
        <div>〒${escapeHtml(issuer.postalCode)}</div>
        <div>${escapeHtml(issuer.address)}</div>
        <div>TEL: ${escapeHtml(issuer.tel)}</div>
        <div>登録番号: ${escapeHtml(issuer.invoiceNo)}</div>
      </div>
    </div>

    <p class="lead">このたびはご注文を賜り誠にありがとうございます。下記のとおりご注文をお請けいたしました。</p>

    <div class="meta">
      <div class="meta-row"><span class="meta-label">受注日</span><span>${escapeHtml(doc.orderDate)}</span></div>
      <div class="meta-row"><span class="meta-label">ステータス</span><span>${escapeHtml(doc.status)}</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>品目</th>
          <th class="num">単価</th>
          <th class="num">数量</th>
          <th class="num">金額</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-inner">
        <div class="total-row"><span>小計</span><span>${yen(doc.subtotal)}</span></div>
        ${shippingRow}
        <div class="total-row"><span>消費税（${Math.round(doc.taxRate * 100)}%）</span><span>${yen(doc.tax)}</span></div>
        <div class="total-row grand"><span>合計</span><span>${yen(doc.total)}</span></div>
      </div>
    </div>

    <div class="footer">
      <div class="note">※本書は注文内容の確認を目的としたものです。記載内容にお心当たりのない場合はお手数ですがご連絡ください。</div>
      <div class="signature"><div class="signature-box">社印</div></div>
    </div>
  </div>
</body>
</html>`;
}
