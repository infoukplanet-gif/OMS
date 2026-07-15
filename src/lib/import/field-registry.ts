/**
 * インポート項目の宣言的レジストリ（純粋データ・Date-free）。
 *
 * 「システム項目」を単なる文字列ではなく、別名（外部CSVの列名バリエーション）・
 * 必須フラグ・型・変換ヒントを持つ構造として一箇所に集約する。
 * これを唯一の情報源として自動マッピング（auto-map.ts）を駆動することで、
 * 取込元ごとの列名ゆれを吸収し、ワンクリックで大半の列を紐付けられるようにする。
 *
 * smartdispatch の「スキーマ（項目定義）→ マッパー（自動変換）」構造に倣った設計。
 */

/** インポート項目の値型。バリデーション・変換の分岐に使う。 */
export type ImportFieldType =
  | "text"
  | "number"
  | "price"
  | "date"
  | "email"
  | "phone"
  | "enum";

/** システム項目1件の宣言的定義。 */
export interface ImportFieldDef {
  /** システム項目キー。<select> の value かつ MappingRow.system に格納される正規名。 */
  key: string;
  /** 画面表示ラベル（本プロジェクトでは key と一致することが多い）。 */
  label: string;
  /** 外部CSVの列名バリエーション（正規化して突き合わせる）。 */
  aliases: string[];
  /** 取込に必須の項目か。未割当なら警告する。 */
  required?: boolean;
  /** 値型。 */
  type?: ImportFieldType;
  /** 変換ヒント（例: 税込単価→税抜計算）。自動割当時に MappingRow.transform へ載せる。 */
  transform?: string;
}

/** 取り込まない列を表す特別な選択肢キー。 */
export const SKIP_FIELD_KEY = "スキップ（取り込まない）";

/**
 * 受注取込のシステム項目定義。
 * 別名は楽天RMS / Amazon / Yahoo! / 各卸先CSVで頻出する列名を網羅する。
 */
export const ORDER_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "商品名",
    label: "商品名",
    required: true,
    type: "text",
    aliases: ["商品名称", "品名", "product name", "item name", "name", "商品タイトル", "タイトル"],
  },
  {
    key: "商品コード(SKU)",
    label: "商品コード(SKU)",
    required: true,
    type: "text",
    aliases: ["sku", "商品コード", "商品番号", "商品id", "item code", "itemcode", "型番", "jan", "janコード"],
  },
  {
    key: "販売価格",
    label: "販売価格",
    type: "price",
    transform: "税抜計算",
    aliases: ["単価", "価格", "金額", "price", "unit price", "unitprice", "単価税込", "税込単価", "販売単価"],
  },
  {
    key: "数量",
    label: "数量",
    required: true,
    type: "number",
    aliases: ["数量", "個数", "数", "qty", "quantity", "注文数", "点数"],
  },
  {
    key: "顧客名",
    label: "顧客名",
    type: "text",
    aliases: ["注文者", "購入者", "お客様名", "顧客名", "氏名", "名前", "customer", "customer name", "buyer"],
  },
  {
    key: "メールアドレス",
    label: "メールアドレス",
    type: "email",
    aliases: ["email", "mail", "メール", "eメール", "e-mail", "メールアドレス", "連絡先メール"],
  },
  {
    key: "電話番号",
    label: "電話番号",
    type: "phone",
    aliases: ["tel", "phone", "電話", "電話番号", "連絡先", "tel番号"],
  },
  {
    key: "郵便番号",
    label: "郵便番号",
    type: "text",
    aliases: ["zip", "postal code", "postalcode", "郵便", "郵便番号", "〒"],
  },
  {
    key: "住所",
    label: "住所",
    type: "text",
    aliases: ["address", "住所", "配送先住所", "お届け先住所", "届け先", "配送先", "送付先"],
  },
  {
    key: "カテゴリ",
    label: "カテゴリ",
    type: "text",
    aliases: ["category", "カテゴリー", "分類", "ジャンル", "商品カテゴリ"],
  },
  {
    key: "備考",
    label: "備考",
    type: "text",
    aliases: ["note", "notes", "memo", "remarks", "備考", "摘要", "コメント", "メモ"],
  },
  {
    key: "配送方法",
    label: "配送方法",
    type: "text",
    aliases: ["配送方法", "配送", "発送方法", "配送区分", "shipping", "shipping method", "配送種別"],
  },
  {
    key: "支払方法",
    label: "支払方法",
    type: "text",
    aliases: ["支払方法", "支払い方法", "決済方法", "支払", "payment", "payment method", "決済"],
  },
];

/** 商品マスタ取込のシステム項目定義。 */
export const PRODUCT_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "商品コード(SKU)",
    label: "商品コード(SKU)",
    required: true,
    type: "text",
    aliases: ["sku", "商品管理番号", "商品コード", "商品番号", "管理番号", "item code", "itemcode", "型番"],
  },
  {
    key: "商品名",
    label: "商品名",
    required: true,
    type: "text",
    aliases: ["品名", "商品名称", "product name", "name", "商品タイトル"],
  },
  {
    key: "商品名カナ",
    label: "商品名カナ",
    type: "text",
    aliases: ["商品カナ", "商品名かな", "商品名フリガナ", "カナ", "フリガナ"],
  },
  {
    key: "JANコード",
    label: "JANコード",
    type: "text",
    aliases: ["jan", "ean", "jan/ean", "jancode", "janコード", "バーコード", "gtin"],
  },
  {
    key: "原価",
    label: "原価",
    type: "price",
    aliases: ["仕入原価", "仕入価格", "仕入単価", "cost", "原価"],
  },
  {
    key: "販売価格",
    label: "販売価格",
    type: "price",
    transform: "税抜計算",
    aliases: ["売価", "定価", "販売価格税込", "税込価格", "販売価格(税込)", "price", "上代"],
  },
  {
    key: "在庫数",
    label: "在庫数",
    type: "number",
    aliases: ["在庫", "在庫数量", "stock", "quantity", "数量", "qty"],
  },
  {
    key: "カテゴリ",
    label: "カテゴリ",
    type: "text",
    aliases: ["category", "カテゴリー", "分類", "ジャンル"],
  },
  { key: "ブランド", label: "ブランド", type: "text", aliases: ["brand", "メーカー", "製造元"] },
  { key: "サイズ", label: "サイズ", type: "text", aliases: ["size", "寸法"] },
  { key: "カラー", label: "カラー", type: "text", aliases: ["color", "colour", "色", "カラー名"] },
  { key: "重量", label: "重量", type: "text", aliases: ["weight", "重さ", "重量g"] },
  { key: "商品説明", label: "商品説明", type: "text", aliases: ["description", "説明", "詳細", "商品詳細"] },
  { key: "状態", label: "状態", type: "text", aliases: ["status", "ステータス", "販売状態"] },
];

/** 共通の連絡先・口座系フィールド（仕入先/卸先で共有）。 */
const CONTACT_FIELDS: ImportFieldDef[] = [
  { key: "担当者", label: "担当者", type: "text", aliases: ["担当", "担当者名", "contact", "窓口"] },
  { key: "担当者カナ", label: "担当者カナ", type: "text", aliases: ["担当者フリガナ", "担当カナ", "担当者ふりがな"] },
  { key: "部署", label: "部署", type: "text", aliases: ["部門", "department", "所属"] },
  { key: "メールアドレス", label: "メールアドレス", type: "email", aliases: ["email", "mail", "メール", "eメール", "e-mail"] },
  { key: "電話", label: "電話", type: "phone", aliases: ["tel", "phone", "電話番号", "連絡先"] },
  { key: "FAX", label: "FAX", type: "phone", aliases: ["fax", "ファックス", "fax番号"] },
  { key: "郵便番号", label: "郵便番号", type: "text", aliases: ["zip", "郵便", "postal", "postalcode", "〒"] },
  { key: "住所", label: "住所", type: "text", aliases: ["address", "所在地", "住所地"] },
];

/** 仕入先マスタ取込のシステム項目定義。 */
export const SUPPLIER_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "仕入先コード",
    label: "仕入先コード",
    required: true,
    type: "text",
    aliases: ["仕入先id", "supplier code", "code", "コード", "取引先コード", "仕入コード"],
  },
  {
    key: "仕入先名",
    label: "仕入先名",
    required: true,
    type: "text",
    aliases: ["仕入先", "supplier", "supplier name", "会社名", "取引先名", "name"],
  },
  { key: "仕入先名カナ", label: "仕入先名カナ", type: "text", aliases: ["仕入先カナ", "カナ", "フリガナ", "ふりがな"] },
  ...CONTACT_FIELDS,
  { key: "支払条件", label: "支払条件", type: "text", aliases: ["payment terms", "決済条件"] },
  { key: "支払サイト", label: "支払サイト", type: "text", aliases: ["サイト", "payment site"] },
  { key: "振込先銀行", label: "振込先銀行", type: "text", aliases: ["銀行", "銀行名", "bank"] },
  { key: "支店", label: "支店", type: "text", aliases: ["支店名", "branch"] },
  { key: "預金種別", label: "預金種別", type: "text", aliases: ["口座種別", "種別", "account type"] },
  { key: "口座番号", label: "口座番号", type: "text", aliases: ["account number", "口座no", "口座ナンバー"] },
  { key: "口座名義", label: "口座名義", type: "text", aliases: ["名義", "account name", "名義人"] },
  { key: "締日", label: "締日", type: "text", aliases: ["締め日", "closing date", "締"] },
  { key: "取引開始日", label: "取引開始日", type: "date", aliases: ["取引開始", "開始日", "start date"] },
  { key: "備考", label: "備考", type: "text", aliases: ["note", "memo", "remarks", "摘要", "コメント"] },
];

/** 卸先マスタ取込のシステム項目定義。 */
export const WHOLESALE_IMPORT_FIELDS: ImportFieldDef[] = [
  {
    key: "卸先コード",
    label: "卸先コード",
    required: true,
    type: "text",
    aliases: ["卸先id", "code", "コード", "取引先コード", "customer code", "得意先コード"],
  },
  {
    key: "卸先名",
    label: "卸先名",
    required: true,
    type: "text",
    aliases: ["卸先", "得意先名", "取引先名", "会社名", "name", "customer name"],
  },
  { key: "卸先名カナ", label: "卸先名カナ", type: "text", aliases: ["卸先カナ", "カナ", "フリガナ", "ふりがな"] },
  { key: "業種", label: "業種", type: "text", aliases: ["industry", "業態", "事業内容"] },
  ...CONTACT_FIELDS,
  { key: "与信限度額", label: "与信限度額", type: "price", aliases: ["与信", "与信枠", "credit limit", "限度額"] },
  { key: "支払条件", label: "支払条件", type: "text", aliases: ["payment terms", "決済条件"] },
  { key: "支払サイト", label: "支払サイト", type: "text", aliases: ["サイト", "payment site"] },
  { key: "振込手数料負担", label: "振込手数料負担", type: "text", aliases: ["手数料負担", "振込手数料"] },
  { key: "締日", label: "締日", type: "text", aliases: ["締め日", "closing date", "締"] },
  { key: "取引開始日", label: "取引開始日", type: "date", aliases: ["取引開始", "開始日", "start date"] },
  { key: "備考", label: "備考", type: "text", aliases: ["note", "memo", "remarks", "摘要", "コメント"] },
];

/** レジストリ由来の項目キー一覧（末尾にスキップを付ける）。既存の string[] インターフェイス互換用。 */
export function fieldKeysWithSkip(fields: ImportFieldDef[]): string[] {
  return [...fields.map((f) => f.key), SKIP_FIELD_KEY];
}
