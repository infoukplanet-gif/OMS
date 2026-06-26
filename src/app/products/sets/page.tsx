"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { cn } from "@/lib/utils";
import { setProductStore, INITIAL_SET_PRODUCTS, type SetProductRecord } from "@/lib/stores/set-product";
import { Boxes, Pencil, Plus, Search, Trash2 } from "lucide-react";

const statusBadge: Record<SetProductRecord["status"], string> = {
  販売中: "bg-emerald-500/15 text-emerald-700",
  停止中: "bg-gray-500/15 text-gray-600",
  予約販売: "bg-blue-500/15 text-blue-700",
  廃番: "bg-red-500/15 text-red-700",
};

export default function SetProductsPage() {
  const toast = useToast();

  usePersistentStore({ store: setProductStore, domain: "set-products", seed: INITIAL_SET_PRODUCTS });

  const items = useSyncExternalStore(
    (cb) => setProductStore.subscribe(cb),
    () => setProductStore.getState() as readonly SetProductRecord[],
    () => INITIAL_SET_PRODUCTS as readonly SetProductRecord[],
  );

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SetProductRecord["status"]>("all");

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((p) => {
      if (k && !`${p.code} ${p.name}`.toLowerCase().includes(k)) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, categoryFilter, statusFilter]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？`)) return;
    setProductStore.remove(id);
    toast.show(`${name} を削除しました`, "info");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-6 w-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-800">セット商品一覧</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            複数商品をまとめたセット・福袋・定期便などを管理します。
          </p>
        </div>
        <Link
          href="/products/sets/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
        >
          <Plus className="h-4 w-4" />セット商品を登録
        </Link>
      </div>

      {/* サマリカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録セット数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            販売中 {items.filter((i) => i.status === "販売中").length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">予約販売中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {items.filter((i) => i.status === "予約販売").length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">平均セット価格</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {items.length > 0
              ? `¥${Math.round(items.reduce((s, i) => s + i.setPrice, 0) / items.length).toLocaleString()}`
              : "—"}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">平均粗利率</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {items.length > 0
              ? `${Math.round(
                  items.reduce((s, i) => s + (i.setPrice > 0 ? ((i.setPrice - i.totalCost) / i.setPrice) * 100 : 0), 0) /
                    items.length,
                )}%`
              : "—"}
          </div>
        </GlassCard>
      </div>

      {/* フィルタ */}
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="セット商品コード・商品名で検索"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">カテゴリ: すべて</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">ステータス: すべて</option>
            <option value="販売中">販売中</option>
            <option value="停止中">停止中</option>
            <option value="予約販売">予約販売</option>
            <option value="廃番">廃番</option>
          </select>
          {(keyword || categoryFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setKeyword("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
              className="px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-600 hover:bg-white/70"
            >
              クリア
            </button>
          )}
        </div>
      </GlassCard>

      {/* テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品コード
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                セット商品名
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                構成点数
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                セット価格
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                粗利率
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新日
              </th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const marginRate =
                p.setPrice > 0
                  ? Math.round(((p.setPrice - p.totalCost) / p.setPrice) * 100)
                  : 0;
              return (
                <tr key={p.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{p.code}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-gray-800">{p.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs text-gray-600 px-2 py-0.5 rounded-full bg-white/60 border border-white/50">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-700">{p.componentCount}点</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 font-medium">
                    ¥{p.setPrice.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        marginRate >= 50
                          ? "text-emerald-700"
                          : marginRate >= 30
                            ? "text-blue-700"
                            : "text-orange-700",
                      )}
                    >
                      {marginRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        statusBadge[p.status],
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{p.updated}</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-1">
                      <Link
                        href={`/products/sets/${p.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25"
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-gray-400">
                  該当するセット商品がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
