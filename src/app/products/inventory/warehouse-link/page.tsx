"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Warehouse, Store, Link2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Shop = { key: string; label: string; mall: string };
type WarehouseDef = { key: string; label: string; kind: "自社" | "外部倉庫" | "モール倉庫" };
type Link = {
  id: number;
  shop: string;
  warehouse: string;
  priority: number;
  ratio: number;
  enabled: boolean;
  lowStockThreshold: number;
  autoReserve: boolean;
};

const SHOPS: Shop[] = [
  { key: "rakuten", label: "楽天市場店", mall: "楽天市場" },
  { key: "yahoo", label: "Yahoo!店", mall: "Yahoo!ショッピング" },
  { key: "amazon", label: "Amazon店", mall: "Amazon" },
  { key: "shopify", label: "自社Shopify", mall: "Shopify" },
  { key: "base", label: "BASE店", mall: "BASE" },
];

const WAREHOUSES: WarehouseDef[] = [
  { key: "main", label: "本社倉庫", kind: "自社" },
  { key: "osaka", label: "大阪倉庫", kind: "自社" },
  { key: "fulfillment", label: "FBA倉庫", kind: "モール倉庫" },
  { key: "3pl_tokyo", label: "3PL東京", kind: "外部倉庫" },
];

const initialLinks: Link[] = [
  { id: 1, shop: "rakuten", warehouse: "main", priority: 1, ratio: 70, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: 2, shop: "rakuten", warehouse: "osaka", priority: 2, ratio: 30, enabled: true, lowStockThreshold: 3, autoReserve: true },
  { id: 3, shop: "yahoo", warehouse: "main", priority: 1, ratio: 100, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: 4, shop: "amazon", warehouse: "fulfillment", priority: 1, ratio: 100, enabled: true, lowStockThreshold: 10, autoReserve: false },
  { id: 5, shop: "shopify", warehouse: "main", priority: 1, ratio: 50, enabled: true, lowStockThreshold: 5, autoReserve: true },
  { id: 6, shop: "shopify", warehouse: "3pl_tokyo", priority: 2, ratio: 50, enabled: false, lowStockThreshold: 5, autoReserve: false },
];

function shopLabel(key: string) { return SHOPS.find((s) => s.key === key)?.label ?? key; }
function warehouseKind(key: string) { return WAREHOUSES.find((w) => w.key === key)?.kind ?? "自社"; }

export default function WarehouseLinkPage() {
  const toast = useToast();
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [filterShop, setFilterShop] = useState<string>("all");

  const filtered = filterShop === "all" ? links : links.filter((l) => l.shop === filterShop);

  function updateLink<K extends keyof Link>(id: number, key: K, value: Link[K]) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [key]: value } : l)));
  }

  function removeLink(id: number) {
    if (!confirm("この連携設定を削除しますか？")) return;
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast.show("連携を削除しました");
  }

  function addLink() {
    const id = Math.max(0, ...links.map((l) => l.id)) + 1;
    setLinks((prev) => [...prev, {
      id, shop: "rakuten", warehouse: "main", priority: prev.filter((p) => p.shop === "rakuten").length + 1,
      ratio: 0, enabled: true, lowStockThreshold: 5, autoReserve: true,
    }]);
    toast.show("連携を追加しました");
  }

  function handleSave() {
    toast.show(`${links.length}件の連携を保存しました`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">拠点と店舗の在庫連携設定</h1>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm"
        >
          <Plus className="h-4 w-4" />連携を追加
        </button>
      </div>

      <GlassCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-white/60 border border-white/60">
            <div className="text-xs text-gray-500">店舗数</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{SHOPS.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-white/60">
            <div className="text-xs text-gray-500">拠点数</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{WAREHOUSES.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-white/60">
            <div className="text-xs text-gray-500">有効な連携</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{links.filter((l) => l.enabled).length}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/60 border border-white/60">
            <div className="text-xs text-gray-500">無効な連携</div>
            <div className="text-xl font-bold text-gray-500 mt-1">{links.filter((l) => !l.enabled).length}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-700">店舗フィルタ:</label>
          <select
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
            className="h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60"
          >
            <option value="all">すべての店舗</option>
            {SHOPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">店舗</th>
                <th className="text-left py-2 px-2 font-medium">連携拠点</th>
                <th className="text-left py-2 px-2 font-medium">種別</th>
                <th className="text-right py-2 px-2 font-medium">優先度</th>
                <th className="text-right py-2 px-2 font-medium">配分比率</th>
                <th className="text-right py-2 px-2 font-medium">欠品閾値</th>
                <th className="text-center py-2 px-2 font-medium">自動引当</th>
                <th className="text-center py-2 px-2 font-medium">有効</th>
                <th className="text-right py-2 px-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-white/40 hover:bg-white/40 transition-colors">
                  <td className="py-2 px-2 text-gray-800 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-gray-400" />{shopLabel(l.shop)}
                  </td>
                  <td className="py-2 px-2 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-gray-400" />
                      <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                      <select
                        value={l.warehouse}
                        onChange={(e) => updateLink(l.id, "warehouse", e.target.value)}
                        className="h-7 px-2 rounded-lg text-xs bg-white/60 border border-white/60"
                      >
                        {WAREHOUSES.map((w) => <option key={w.key} value={w.key}>{w.label}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      warehouseKind(l.warehouse) === "自社" ? "bg-blue-500/15 text-blue-700" :
                      warehouseKind(l.warehouse) === "モール倉庫" ? "bg-orange-500/15 text-orange-700" :
                      "bg-purple-500/15 text-purple-700"
                    )}>
                      {warehouseKind(l.warehouse)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number" min={1} max={99}
                      value={l.priority}
                      onChange={(e) => updateLink(l.id, "priority", Number(e.target.value))}
                      className="w-14 h-7 px-2 rounded-lg text-xs text-right bg-white/60 border border-white/60"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number" min={0} max={100}
                      value={l.ratio}
                      onChange={(e) => updateLink(l.id, "ratio", Number(e.target.value))}
                      className="w-16 h-7 px-2 rounded-lg text-xs text-right bg-white/60 border border-white/60"
                    />
                    <span className="text-xs text-gray-500 ml-1">%</span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number" min={0}
                      value={l.lowStockThreshold}
                      onChange={(e) => updateLink(l.id, "lowStockThreshold", Number(e.target.value))}
                      className="w-16 h-7 px-2 rounded-lg text-xs text-right bg-white/60 border border-white/60"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox" checked={l.autoReserve}
                      onChange={(e) => updateLink(l.id, "autoReserve", e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox" className="sr-only peer"
                        checked={l.enabled}
                        onChange={(e) => updateLink(l.id, "enabled", e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLink(l.id)}
                      aria-label="削除"
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-gray-500">該当する連携がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={() => setLinks(initialLinks)}>変更を破棄</SecondaryButton>
        <PrimaryButton onClick={handleSave}>設定を保存</PrimaryButton>
      </div>
    </div>
  );
}
