"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Upload, Download, Store, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/export/csv";
import { DetailModal } from "@/components/ui/detail-modal";
import { parseMallCsv, type MallProductRow } from "@/lib/products/mall-import";
import { productStore, type ProductRecord } from "@/lib/stores/product";
import { snapshotDomain } from "@/app/_actions/snapshots";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { mallImportHistoryStore, type MallImportBatch } from "@/lib/stores/mall-import-history";
import { INITIAL_MALL_IMPORT_HISTORY } from "@/lib/seeds/mall-import-history";

type Mall = {
  key: string;
  label: string;
  icon: string;
  hasTemplate: boolean;
  note: string;
};

const MALLS: Mall[] = [
  { key: "rakuten", label: "楽天市場", icon: "🛍️", hasTemplate: true, note: "item.csv / select.csv 形式対応" },
  { key: "yahoo", label: "Yahoo!ショッピング", icon: "🛒", hasTemplate: true, note: "ストアクリエイターPro CSV対応" },
  { key: "amazon", label: "Amazon", icon: "📦", hasTemplate: true, note: "在庫ファイルテンプレート対応" },
  { key: "makeshop", label: "makeshop", icon: "🏪", hasTemplate: true, note: "商品一括CSV対応" },
  { key: "shopify", label: "Shopify", icon: "🛒", hasTemplate: true, note: "Products CSV対応" },
  { key: "base", label: "BASE", icon: "🏬", hasTemplate: false, note: "APIから自動取得可" },
  { key: "stores", label: "STORES", icon: "🏢", hasTemplate: false, note: "APIから自動取得可" },
  { key: "colorme", label: "カラーミーショップ", icon: "🎨", hasTemplate: true, note: "商品CSV対応" },
];

/** モール公式の商品CSVフォーマットに合わせたテンプレートヘッダー（hasTemplate のモールのみ）。 */
const TEMPLATE_HEADERS: Record<string, string[]> = {
  rakuten: ["商品管理番号（商品URL）", "商品番号", "商品名", "販売価格", "在庫数", "ジャンルID", "カタログID"],
  yahoo: ["code", "name", "price", "quantity", "jan", "product-category"],
  amazon: ["sku", "product-id", "product-id-type", "price", "quantity", "condition-type"],
  makeshop: ["独自商品コード", "商品名", "販売価格", "在庫数", "JANコード", "カテゴリー"],
  shopify: ["Handle", "Title", "Vendor", "Type", "Variant SKU", "Variant Price", "Variant Inventory Qty"],
  colorme: ["商品ID", "商品名", "型番", "販売価格", "在庫数", "カテゴリー"],
};

const pad = (n: number) => String(n).padStart(2, "0");

/** モール種別キーから商品マスタ表示用カテゴリへのフォールバック（新規取込商品の初期分類）。 */
const NEW_PRODUCT_CATEGORY = "未分類";

/**
 * パース済み1行を、重複時動作（skip/overwrite/merge）に従って商品マスタへ反映する。
 * @returns 反映できた件数（skip で既存に当たった行は反映しないので数えない）
 */
function applyRowsToProducts(
  rows: readonly MallProductRow[],
  duplicateAction: "skip" | "overwrite" | "merge",
): number {
  let applied = 0;
  for (const row of rows) {
    const existing = productStore.findByCode(row.code);
    if (existing) {
      if (duplicateAction === "skip") continue;
      if (duplicateAction === "overwrite") {
        productStore.upsert({
          ...existing,
          name: row.name,
          price: row.price,
          jan: row.jan,
          stock: row.stock,
        });
        applied += 1;
        continue;
      }
      // merge: 既存の空欄（未設定・0・空文字）だけをモール側の値で埋める。
      const merged: ProductRecord = {
        ...existing,
        name: existing.name ? existing.name : row.name,
        price: existing.price > 0 ? existing.price : row.price,
        jan: existing.jan ? existing.jan : row.jan,
        stock: typeof existing.stock === "number" && existing.stock > 0 ? existing.stock : row.stock,
      };
      productStore.upsert(merged);
      applied += 1;
      continue;
    }
    // 新規商品: モール取込分は最小項目で登録（分類・状態・原価は既定値）。
    productStore.upsert({
      code: row.code,
      name: row.name,
      category: NEW_PRODUCT_CATEGORY,
      price: row.price,
      cost: 0,
      status: "販売中",
      jan: row.jan,
      stock: row.stock,
    });
    applied += 1;
  }
  return applied;
}

export default function MallImportPage() {
  const toast = useToast();
  const [detailRow, setDetailRow] = useState<MallImportBatch | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedMall, setSelectedMall] = useState<string>("rakuten");
  const [file, setFile] = useState<File | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "overwrite" | "merge">("merge");
  const [autoMapSku, setAutoMapSku] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // 永続化（domain: "mall-import-history"）の正規オーナーページ。
  usePersistentStore({
    store: mallImportHistoryStore,
    domain: "mall-import-history",
    seed: INITIAL_MALL_IMPORT_HISTORY,
  });

  const history = useSyncExternalStore(
    (cb) => mallImportHistoryStore.subscribe(cb),
    () => mallImportHistoryStore.getState(),
    () => INITIAL_MALL_IMPORT_HISTORY,
  );
  // 新しいバッチを上に（at は "YYYY-MM-DD HH:MM" で文字列降順ソート可能）。
  const sortedHistory = [...history].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  const mall = MALLS.find((m) => m.key === selectedMall)!;

  function onPick() { inputRef.current?.click(); }
  function onFile(f: File | null) {
    if (!f) return;
    setFile(f);
    toast.show(`「${f.name}」を読み込みました`);
  }

  function handleTemplate() {
    const headers = TEMPLATE_HEADERS[mall.key];
    if (!headers) return toast.show(`${mall.label} はAPI連携のためテンプレートはありません`, "info");
    downloadCsv(`${mall.label}_商品テンプレート.csv`, headers, []);
    toast.show(`${mall.label} のテンプレートをダウンロードしました`, "success");
  }

  async function handleExecute() {
    if (!file) {
      toast.show("ファイルが選択されていません", "error");
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      toast.show("ファイルの読み込みに失敗しました", "error");
      return;
    }

    const parsed = parseMallCsv(mall.key, text);
    if (parsed.totalRows === 0) {
      toast.show("有効なデータ行が見つかりませんでした（ヘッダー行のみ／空ファイル）", "error");
      return;
    }

    // 実反映: パース済み行を重複時動作に従って商品マスタへ upsert。
    const applied = applyRowsToProducts(parsed.rows, duplicateAction);
    // 取り込めなかった行 = パース失敗行 + 重複スキップ（skip で既存に当たった分）。
    const error = parsed.totalRows - applied;

    // 商品マスタの更新を永続化（非オーナー書き込みなので明示スナップショット）。
    void snapshotDomain("products", productStore.getState());

    // 取込バッチを履歴ストアへ実レコードとして追加（リロード後も残す）。
    const now = new Date();
    const at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const id = `MALLB-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    mallImportHistoryStore.upsert({
      id,
      mall: mall.label,
      filename: file.name,
      rows: parsed.totalRows,
      success: applied,
      error,
      at,
    });

    setFile(null);
    if (applied === 0) {
      toast.show(`${mall.label}: ${parsed.totalRows}行を読み込みましたが、反映できた商品はありません`, "info");
    } else if (error > 0) {
      toast.show(`${mall.label}: ${applied}件を商品マスタへ反映（${error}件はスキップ／取込不可）`, "success");
    } else {
      toast.show(`${mall.label}: ${applied}件を商品マスタへ反映しました`, "success");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">モール商品一括登録</h1>
        <button
          type="button"
          onClick={handleTemplate}
          disabled={!mall.hasTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />{mall.label}のテンプレート
        </button>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">① モールを選択</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MALLS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMall(m.key)}
              className={cn(
                "p-3 rounded-xl text-left border transition-all",
                selectedMall === m.key
                  ? "bg-blue-500/10 border-blue-400/60 ring-2 ring-blue-500/30"
                  : "bg-white/60 border-white/60 hover:bg-white/80"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{m.icon}</span>
                <span className="font-medium text-sm text-gray-800">{m.label}</span>
              </div>
              <div className="text-xs text-gray-500">{m.note}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">② ファイル選択</h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={onPick}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
            dragOver ? "border-blue-400 bg-blue-50/40" : "border-gray-300/50 bg-white/30 hover:bg-white/50"
          )}
        >
          {file ? (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-base font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />選択を解除
              </button>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-base font-medium text-gray-700">{mall.label} の商品CSVをドロップ</p>
              <p className="text-xs text-gray-500">またはクリックしてファイルを選択</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">③ 重複時の動作</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "skip", label: "スキップ", desc: "既存は変更しない" },
            { key: "overwrite", label: "上書き", desc: "モール側の情報で置換" },
            { key: "merge", label: "マージ", desc: "空欄のみ埋める" },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDuplicateAction(opt.key as typeof duplicateAction)}
              className={cn(
                "p-3 rounded-xl text-sm text-left border transition-all",
                duplicateAction === opt.key
                  ? "bg-blue-500/10 border-blue-400/60 ring-2 ring-blue-500/30"
                  : "bg-white/60 border-white/60 hover:bg-white/80"
              )}
            >
              <div className="font-medium text-gray-800">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
          <input type="checkbox" checked={autoMapSku} onChange={(e) => setAutoMapSku(e.target.checked)} className="rounded" />
          <span className="text-gray-700">モール商品コードをSKUへ自動マッピング</span>
        </label>
      </GlassCard>

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={() => setFile(null)}>キャンセル</SecondaryButton>
        <PrimaryButton onClick={handleExecute}>取込を実行</PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">取込履歴</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">実行日時</th>
                <th className="text-left py-2 px-2 font-medium">モール</th>
                <th className="text-left py-2 px-2 font-medium">ファイル名</th>
                <th className="text-right py-2 px-2 font-medium">行数</th>
                <th className="text-right py-2 px-2 font-medium">成功</th>
                <th className="text-right py-2 px-2 font-medium">エラー</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedHistory.map((h) => (
                <tr key={h.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-700">{h.at}</td>
                  <td className="py-2 px-2 text-gray-800 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-gray-400" />{h.mall}
                  </td>
                  <td className="py-2 px-2 text-gray-700">{h.filename}</td>
                  <td className="py-2 px-2 text-right text-gray-700">{h.rows}</td>
                  <td className="py-2 px-2 text-right text-emerald-700">{h.success}</td>
                  <td className={cn("py-2 px-2 text-right", h.error > 0 ? "text-red-600" : "text-gray-400")}>{h.error}</td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailRow(h)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <DetailModal
        open={detailRow !== null}
        title="モール取込履歴の詳細"
        subtitle={detailRow?.filename}
        rows={
          detailRow
            ? [
                { label: "実行日時", value: detailRow.at },
                { label: "モール", value: detailRow.mall },
                { label: "ファイル名", value: detailRow.filename, mono: true },
                { label: "総行数", value: `${detailRow.rows} 件` },
                { label: "成功", value: `${detailRow.success} 件`, tone: "success" },
                { label: "エラー", value: `${detailRow.error} 件`, tone: detailRow.error > 0 ? "danger" : "default" },
              ]
            : []
        }
        onClose={() => setDetailRow(null)}
      />
    </div>
  );
}
