"use client";
import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Search } from "lucide-react";
import { productStore } from "@/lib/stores/product";
import { inventoryStore } from "@/lib/stores/inventory";
import { INITIAL_PRODUCTS } from "@/lib/seeds/products";

interface CheckResult {
  type: "success" | "warning" | "error";
  messages: string[];
}

export default function InventoryCheckPage() {
  const [shop, setShop] = useState("楽天市場");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);

  // productStore を購読して最新の商品一覧を取得する
  const products = useSyncExternalStore(
    (cb) => productStore.subscribe(cb),
    () => productStore.getState(),
    () => INITIAL_PRODUCTS,
  );

  // inventoryStore を購読して最新の在庫一覧を取得する
  const inventoryItems = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.getState(),
    () => inventoryStore.getState(),
  );

  const handleCheck = () => {
    const q = code.trim().toUpperCase();
    if (!q) return;

    // 自社コードで一致検索（大文字非感度）
    const product = products.find(
      (p) => p.code.toUpperCase() === q,
    );

    if (!product) {
      setResult({
        type: "error",
        messages: [
          "商品が登録されていません。",
          `指定されたコード「${code}」は商品マスタに存在しません。`,
          "対応: 商品マスタに登録するか、商品コード紐づけ画面で関連付けを行ってください。",
        ],
      });
      return;
    }

    // inventoryStore から対象 SKU の在庫レコードを収集
    const invRecords = inventoryItems.filter(
      (r) => r.sku.toUpperCase() === q,
    );

    // 在庫サマリ計算
    const totalOnHand = invRecords.reduce((s, r) => s + r.onHand, 0);
    const totalAllocated = invRecords.reduce((s, r) => s + r.allocated, 0);
    const totalFree = totalOnHand - totalAllocated;

    const warehouseLines = invRecords.map(
      (r) =>
        `・拠点「${r.warehouse}」: 実在庫 ${r.onHand} / 引当済 ${r.allocated} / フリー ${r.onHand - r.allocated}`,
    );

    const statusLabel =
      product.status === "販売中"
        ? "販売中"
        : product.status === "停止中"
          ? "停止中（注意）"
          : "廃番（販売不可）";

    const hasInventory = invRecords.length > 0;
    const resultType: CheckResult["type"] =
      product.status === "廃番"
        ? "warning"
        : !hasInventory
          ? "warning"
          : "success";

    setResult({
      type: resultType,
      messages: [
        resultType === "success"
          ? "在庫連携可能な状態です。"
          : resultType === "warning"
            ? "警告: 一部設定が不完全です。"
            : "エラーが検出されました。",
        `店舗: ${shop}`,
        `自社商品コード: ${product.code}`,
        `商品名: ${product.name}`,
        `カテゴリ: ${product.category}`,
        `ステータス: ${statusLabel}`,
        ...(hasInventory
          ? [
              `フリー在庫数: ${totalFree}個（実在庫 ${totalOnHand} / 引当済 ${totalAllocated}）`,
              ...warehouseLines,
            ]
          : ["在庫レコードが見つかりません（在庫管理画面で登録してください）"]),
        ...(product.status === "廃番" ? ["※廃番商品のため受注受付不可です。"] : []),
      ],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">在庫連携確認</h1>
        <p className="text-sm text-gray-500 mt-1">
          店舗と商品コードを指定して、在庫連携の状況を確認します。
        </p>
      </div>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">確認したい商品を指定</h2>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">店舗</label>
            <select
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option>楽天市場</option>
              <option>Amazon</option>
              <option>Yahoo!ショッピング</option>
              <option>Shopify</option>
            </select>
          </div>
          <div className="col-span-7 space-y-1.5">
            <label className="text-sm font-medium text-gray-700">商品コード</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="自社商品コードを入力 (例: WEP-001)"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleCheck}
              disabled={!code.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                code.trim()
                  ? "bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
                  : "bg-white/40 border border-white/40 text-gray-400 cursor-not-allowed",
              )}
            >
              <Search className="h-4 w-4" />
              確認
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          商品マスタ登録件数: {products.length}件 / 在庫レコード件数: {inventoryItems.length}件
        </p>
      </GlassCard>

      {result && (
        <GlassCard
          className={cn(
            result.type === "success"
              ? "bg-blue-500/5 border-blue-500/20"
              : result.type === "warning"
                ? "bg-yellow-500/5 border-yellow-500/20"
                : "bg-red-500/5 border-red-500/20",
          )}
        >
          <div className="flex items-start gap-3">
            {result.type === "success" ? (
              <Check className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            ) : result.type === "warning" ? (
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  result.type === "success"
                    ? "text-blue-800"
                    : result.type === "warning"
                      ? "text-yellow-800"
                      : "text-red-800",
                )}
              >
                {result.messages[0]}
              </p>
              <ul className="mt-2 space-y-1">
                {result.messages.slice(1).map((m, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="bg-gray-500/5">
        <p className="text-xs text-gray-500 mb-2">表示メッセージの凡例</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-700">青</span>
            <span className="text-gray-600">在庫連携可能</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full font-medium bg-yellow-500/15 text-yellow-700">黄</span>
            <span className="text-gray-600">一部設定不完全</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full font-medium bg-red-500/15 text-red-700">赤</span>
            <span className="text-gray-600">商品未登録・エラー</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
