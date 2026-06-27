/**
 * モール商品CSVのパーサ（純粋ロジック）。
 *
 * products/mall-import ページが選択ファイルのテキストを読み、モール種別ごとの列名で
 * 商品コード・商品名・販売価格・在庫数・JAN を抽出する。モール公式CSVは列名・区切り文字が
 * まちまちなので、モールごとの「列名候補」テーブルで吸収する（位置依存にしない）。
 *
 * v1 はブラウザ上の簡易取込（DB/正規バリデーション無し）。列が見つからない・コード空の行は
 * errorRows として件数のみ数え、有効行だけ productStore へ反映する側へ返す。
 */

/** パース済みの1商品行。 */
export interface MallProductRow {
  /** 商品コード（SKU 相当・一意キー）。 */
  code: string;
  name: string;
  price: number;
  stock: number;
  jan: string;
}

export interface MallParseResult {
  /** code を取得できた有効行。 */
  rows: MallProductRow[];
  /** code が空などで取り込めなかったデータ行数。 */
  errorRows: number;
  /** ヘッダーを除いたデータ行総数。 */
  totalRows: number;
}

/** モール種別ごとの、各項目に対応する列名候補（先頭優先・大文字小文字無視で照合）。 */
interface MallFieldMap {
  code: string[];
  name: string[];
  price: string[];
  stock: string[];
  jan: string[];
}

const GENERIC_MAP: MallFieldMap = {
  code: ["商品コード", "商品番号", "code", "sku", "型番"],
  name: ["商品名", "name", "title"],
  price: ["販売価格", "価格", "price"],
  stock: ["在庫数", "在庫", "quantity", "stock"],
  jan: ["jan", "janコード", "ean", "barcode"],
};

const FIELD_MAPS: Record<string, MallFieldMap> = {
  rakuten: {
    code: ["商品番号", "商品管理番号（商品URL）"],
    name: ["商品名"],
    price: ["販売価格"],
    stock: ["在庫数"],
    jan: ["janコード", "jan"],
  },
  yahoo: {
    code: ["code"],
    name: ["name"],
    price: ["price"],
    stock: ["quantity"],
    jan: ["jan"],
  },
  amazon: {
    code: ["sku"],
    name: ["item-name", "name", "product-id"],
    price: ["price"],
    stock: ["quantity"],
    jan: ["product-id"],
  },
  makeshop: {
    code: ["独自商品コード"],
    name: ["商品名"],
    price: ["販売価格"],
    stock: ["在庫数"],
    jan: ["janコード"],
  },
  shopify: {
    code: ["variant sku", "handle"],
    name: ["title"],
    price: ["variant price"],
    stock: ["variant inventory qty"],
    jan: ["variant barcode"],
  },
  colorme: {
    code: ["型番", "商品id"],
    name: ["商品名"],
    price: ["販売価格"],
    stock: ["在庫数"],
    jan: ["janコード"],
  },
};

/** 区切り文字付き1行を、ダブルクォート囲みを尊重してセル配列へ分解する。 */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

/** ヘッダー行からタブ／カンマのうち多い方を区切り文字として推定する。 */
function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

/** 候補列名のうち最初に一致したヘッダーの index を返す（大文字小文字無視）。無ければ -1。 */
function resolveIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(cand.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

/** "¥1,200" や "1200円" 等から数値を取り出す。取れなければ 0。 */
function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * モール商品CSVテキストをパースする。
 *
 * @param mallKey モール種別キー（rakuten / yahoo / amazon / makeshop / shopify / colorme / その他）
 * @param text   取込ファイルの全文テキスト
 */
export function parseMallCsv(mallKey: string, text: string): MallParseResult {
  const lines = text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errorRows: 0, totalRows: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);
  const map = FIELD_MAPS[mallKey] ?? GENERIC_MAP;

  const codeIdx = resolveIndex(headers, map.code);
  const nameIdx = resolveIndex(headers, map.name);
  const priceIdx = resolveIndex(headers, map.price);
  const stockIdx = resolveIndex(headers, map.stock);
  const janIdx = resolveIndex(headers, map.jan);

  const dataLines = lines.slice(1);
  const rows: MallProductRow[] = [];
  let errorRows = 0;

  for (const line of dataLines) {
    const cells = splitLine(line, delimiter);
    const code = codeIdx >= 0 ? (cells[codeIdx] ?? "").trim() : "";
    if (!code) {
      errorRows += 1;
      continue;
    }
    const name = nameIdx >= 0 ? (cells[nameIdx] ?? "").trim() : "";
    rows.push({
      code,
      name: name || code,
      price: parseNumber(cells[priceIdx]),
      stock: parseNumber(cells[stockIdx]),
      jan: janIdx >= 0 ? (cells[janIdx] ?? "").trim() : "",
    });
  }

  return { rows, errorRows, totalRows: dataLines.length };
}
