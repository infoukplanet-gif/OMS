/**
 * 自社（発行元）情報。発注書・各種帳票の発行元欄に印字する。
 *
 * v1 は定数（設定画面で編集可能にするのは将来対応）。インボイス番号は
 * 帳票テンプレートの showInvoice が true のときだけ印字される。
 */

export interface CompanyIssuer {
  name: string;
  postalCode: string;
  address: string;
  tel: string;
  /** 適格請求書発行事業者番号（インボイス番号）。 */
  invoiceNo: string;
}

export const COMPANY_ISSUER: CompanyIssuer = {
  name: "株式会社サンプル商事",
  postalCode: "150-0001",
  address: "東京都渋谷区神宮前1-2-3 サンプルビル5F",
  tel: "03-1234-5678",
  invoiceNo: "T1234567890123",
};
