"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { productStore } from "@/lib/stores/product";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { INITIAL_PRODUCTS } from "@/lib/seeds/products";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Upload,
} from "lucide-react";

type ProductStatus = "販売中" | "停止中" | "廃番";
type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  skus: number;
  price: number;
  cost: number;
  stock: number;
  safety: number;
  status: ProductStatus;
  updated: string;
};

// 初期シードは src/lib/seeds/products.ts (INITIAL_PRODUCTS) に集約。
// productStore に投入され、商品登録フォームや受注作成ページのサジェストと共有される。

const tabs: { label: string; value: "list" | "inventory" | "set" }[] = [
  { label: "商品一覧", value: "list" },
  { label: "在庫管理", value: "inventory" },
  { label: "セット商品", value: "set" },
];

const stockBadge = (current: number, safety: number) => {
  if (current === 0) return { label: "在庫切れ", class: "bg-red-500/15 text-red-700", state: "out" };
  if (current <= safety) return { label: "低在庫", class: "bg-yellow-500/15 text-yellow-700", state: "low" };
  return { label: "十分", class: "bg-emerald-500/15 text-emerald-700", state: "ok" };
};

const statusMap: Record<ProductStatus, string> = {
  販売中: "bg-emerald-500/15 text-emerald-700",
  停止中: "bg-gray-500/15 text-gray-600",
  廃番: "bg-red-500/15 text-red-700",
};

const PAGE_SIZE = 20;
const STATUS_OPTIONS: ProductStatus[] = ["販売中", "停止中", "廃番"];

export default function ProductsPage() {
  const toast = useToast();

  // 商品ドメインの正規オーナーページ: 初回 restore → なければ seed、変更を debounce 永続化。
  // 商品登録（/products/new）で追加・更新された商品も即座にここに反映され、
  // 受注作成画面の商品サジェストとも同じインスタンスを共有する。
  usePersistentStore({
    store: productStore,
    domain: "products",
    seed: INITIAL_PRODUCTS,
  });
  const items = useSyncExternalStore(
    (cb) => productStore.subscribe(cb),
    () => productStore.getState() as readonly Product[],
    () => INITIAL_PRODUCTS as readonly Product[],
  ) as readonly Product[];

  const [activeTab, setActiveTab] = useState<"list" | "inventory" | "set">("list");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "low" | "ok">("all");
  const [page, setPage] = useState(1);

  // 一括ステータス変更モーダル
  const [statusModal, setStatusModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("販売中");

  // 一括カテゴリ変更モーダル
  const [categoryModal, setCategoryModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");

  const categories = Array.from(new Set(items.map((i) => i.category)));

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((p) => {
      if (k && !`${p.code} ${p.name}`.toLowerCase().includes(k)) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (stockFilter !== "all") {
        const s = stockBadge(p.stock, p.safety).state;
        if (s !== stockFilter) return false;
      }
      return true;
    });
  }, [items, keyword, categoryFilter, statusFilter, stockFilter]);

  // ページネーション
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // フィルタ変更時にページをリセット
  const resetPage = () => setPage(1);

  const toggleSelect = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () =>
    setSelected((p) => (p.length === paged.length ? [] : paged.map((x) => x.id)));

  const hasFilter = keyword || categoryFilter !== "all" || statusFilter !== "all" || stockFilter !== "all";

  // ---- 一括操作 ----

  function bulkChangeStatus() {
    if (selected.length === 0) return;
    const current = productStore.getState() as readonly Product[];
    const next = current.map((p) =>
      selected.includes(p.id) ? { ...p, status: bulkStatus } : p
    );
    productStore.setItems(next);
    toast.show(`${selected.length} 件のステータスを「${bulkStatus}」に変更しました`, "success");
    setSelected([]);
    setStatusModal(false);
  }

  function bulkChangeCategory() {
    if (selected.length === 0 || !bulkCategory.trim()) return;
    const current = productStore.getState() as readonly Product[];
    const next = current.map((p) =>
      selected.includes(p.id) ? { ...p, category: bulkCategory.trim() } : p
    );
    productStore.setItems(next);
    toast.show(`${selected.length} 件のカテゴリを「${bulkCategory}」に変更しました`, "success");
    setSelected([]);
    setCategoryModal(false);
    setBulkCategory("");
  }

  function bulkDelete() {
    if (selected.length === 0) return;
    if (!confirm(`${selected.length} 件の商品を削除しますか？この操作は取り消せません。`)) return;
    const current = productStore.getState() as readonly Product[];
    const next = current.filter((p) => !selected.includes(p.id));
    productStore.setItems(next);
    toast.show(`${selected.length} 件の商品を削除しました`, "success");
    setSelected([]);
    resetPage();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/products/import"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}
          >
            <Upload className="h-4 w-4" />
            一括登録
          </Link>
          <Link
            href="/products/new"
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}
          >
            <Plus className="h-4 w-4" />
            商品登録
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-max sm:w-fit">
          {tabs.map((tab) =>
            tab.value === "set" ? (
              <Link
                key={tab.value}
                href="/products/sets"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                  "text-gray-500 hover:text-gray-700 hover:bg-white/40",
                )}
              >
                {tab.label}
              </Link>
            ) : tab.value === "inventory" ? (
              <Link
                key={tab.value}
                href="/products/inventory"
                className={cn(
                  "px-4 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.value
                    ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/40",
                )}
              >
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm transition-all duration-200 whitespace-nowrap",
                  activeTab === tab.value
                    ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/40",
                )}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(140px,180px))_auto] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); resetPage(); }}
            type="text"
            placeholder="商品名・SKUで検索"
            className={cn("w-full h-9 pl-10 pr-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">カテゴリ: すべて</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); resetPage(); }}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">ステータス: すべて</option>
          <option value="販売中">販売中</option>
          <option value="停止中">停止中</option>
          <option value="廃番">廃番</option>
        </select>
        <select
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value as typeof stockFilter); resetPage(); }}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">在庫: すべて</option>
          <option value="out">在庫切れ</option>
          <option value="low">低在庫</option>
          <option value="ok">十分</option>
        </select>
        {hasFilter && (
          <button
            onClick={() => { setKeyword(""); setCategoryFilter("all"); setStatusFilter("all"); setStockFilter("all"); resetPage(); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70 whitespace-nowrap"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.length === paged.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-12 px-3 py-3" />
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品コード</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">販売価格</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">原価</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">在庫</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新日</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => {
                const stock = stockBadge(p.stock, p.safety);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(p.id) ? "bg-blue-500/5" : "hover:bg-white/40",
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-100/60 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.code}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/products/${p.id}/edit`} className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600">{p.category}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{p.skus}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800 tabular-nums">¥{p.price.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right text-gray-500 tabular-nums">¥{p.cost.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={cn(
                            "font-medium tabular-nums",
                            p.stock === 0 ? "text-red-600" : p.stock <= p.safety ? "text-yellow-600" : "text-gray-700",
                          )}
                        >
                          {p.stock}
                        </span>
                        <span
                          className={cn(
                            "inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap",
                            stock.class,
                          )}
                        >
                          {stock.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                          statusMap[p.status],
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{p.updated}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-12 text-center text-sm text-gray-400">
                    該当する商品がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* フッター: 一括操作 + ページネーション */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-white/40 bg-white/30">
          <div className="min-h-[28px]">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button
                  onClick={() => setStatusModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors"
                >
                  ステータス変更
                </button>
                <button
                  onClick={() => { setBulkCategory(categories[0] ?? ""); setCategoryModal(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors"
                >
                  カテゴリ変更
                </button>
                <button
                  onClick={bulkDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filtered.length} 件 / 全 {items.length} 件
              {totalPages > 1 && ` （${safePage} / ${totalPages} ページ）`}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="前のページ"
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  safePage <= 1
                    ? "bg-white/30 border-white/30 text-gray-300 cursor-not-allowed"
                    : "bg-white/50 border-white/40 text-gray-600 hover:bg-white/70",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="次のページ"
                className={cn(
                  "p-1.5 rounded-lg border transition-colors",
                  safePage >= totalPages
                    ? "bg-white/30 border-white/30 text-gray-300 cursor-not-allowed"
                    : "bg-white/50 border-white/40 text-gray-600 hover:bg-white/70",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 一括ステータス変更モーダル */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title={`ステータス一括変更（${selected.length} 件）`}
        footer={
          <>
            <SecondaryButton onClick={() => setStatusModal(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={bulkChangeStatus}>変更を適用</PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            選択した <span className="font-semibold">{selected.length} 件</span> の商品ステータスを一括で変更します。
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">変更後のステータス</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBulkStatus(s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                    bulkStatus === s
                      ? "bg-blue-500/80 border-blue-400/50 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                      : "bg-white/60 border-white/50 text-gray-700 hover:bg-white/80",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 一括カテゴリ変更モーダル */}
      <Modal
        open={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={`カテゴリ一括変更（${selected.length} 件）`}
        footer={
          <>
            <SecondaryButton onClick={() => setCategoryModal(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={bulkChangeCategory} disabled={!bulkCategory.trim()}>
              変更を適用
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            選択した <span className="font-semibold">{selected.length} 件</span> の商品カテゴリを一括で変更します。
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">変更後のカテゴリ</label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">または新しいカテゴリ名を直接入力:</p>
            <input
              type="text"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              placeholder="例: アパレル"
              className="mt-1 w-full h-9 px-3 rounded-xl text-sm bg-white/60 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
