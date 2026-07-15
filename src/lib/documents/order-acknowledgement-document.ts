/**
 * 注文請書ドキュメントモデル生成（純粋関数・Date-free）。
 *
 * 受注レコード（注文者・明細・送料）を受け取り、印刷可能な注文請書
 * （顧客の注文を承った旨を通知する帳票）が描画できる構造化ドキュメントを返す。
 * 行金額・小計・消費税・合計の算出をここに集約する。
 *
 * ここは src/lib なので Date を触らない。発行日・受注日は呼び出し側が文字列で渡す。
 */

/** 消費税率（注文請書の税内訳表示で使用）。 */
export const ORDER_ACKNOWLEDGEMENT_TAX_RATE = 0.1;

/** 注文請書生成の入力となる受注レコード（受注詳細ページから必要分を抽出）。 */
export interface OrderAcknowledgementSource {
  /** 受注番号。 */
  id: string;
  /** 注文者名。 */
  customerName: string;
  /** 受注日（YYYY/MM/DD 文字列）。 */
  orderDate: string;
  /** 現在の受注ステータス（表示用）。 */
  status: string;
  /** 送料。0 のときは送料行を出さない。 */
  shippingFee: number;
  lines: ReadonlyArray<{
    sku: string;
    name?: string;
    unitPrice: number;
    qty: number;
  }>;
}

export interface OrderAcknowledgementDocumentLine {
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
  amount: number;
}

export interface OrderAcknowledgementDocument {
  title: string;
  documentNo: string;
  issueDate: string;
  customerName: string;
  orderDate: string;
  status: string;
  lines: OrderAcknowledgementDocumentLine[];
  subtotal: number;
  shippingFee: number;
  taxRate: number;
  tax: number;
  total: number;
}

/**
 * 受注レコードから注文請書ドキュメントを構築する。
 *
 * 消費税は「小計＋送料」に対して課税し、四捨五入する（受注詳細画面の合計と一致させる）。
 *
 * @param source 受注レコード
 * @param issueDate 発行日（省略時は受注日を流用）
 */
export function buildOrderAcknowledgementDocument(
  source: OrderAcknowledgementSource,
  issueDate?: string,
): OrderAcknowledgementDocument {
  const lines: OrderAcknowledgementDocumentLine[] = source.lines.map((line) => ({
    sku: line.sku,
    name: line.name && line.name.trim() !== "" ? line.name : line.sku,
    unitPrice: line.unitPrice,
    qty: line.qty,
    amount: line.unitPrice * line.qty,
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const shippingFee = source.shippingFee > 0 ? source.shippingFee : 0;
  const tax = Math.round((subtotal + shippingFee) * ORDER_ACKNOWLEDGEMENT_TAX_RATE);
  const total = subtotal + shippingFee + tax;

  return {
    title: "注文請書",
    documentNo: source.id,
    issueDate: issueDate ?? source.orderDate,
    customerName: source.customerName,
    orderDate: source.orderDate,
    status: source.status,
    lines,
    subtotal,
    shippingFee,
    taxRate: ORDER_ACKNOWLEDGEMENT_TAX_RATE,
    tax,
    total,
  };
}
