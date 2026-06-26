"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { shopStore, INITIAL_SHOPS, type ShopRecord } from "@/lib/stores/shop";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

const sb: Record<string, string> = {
  連携中: "bg-emerald-500/15 text-emerald-700",
  エラー: "bg-red-500/15 text-red-700",
  停止中: "bg-gray-500/15 text-gray-600",
  未設定: "bg-amber-500/15 text-amber-700",
};

export default function ShopsPage() {
  const toast = useToast();

  usePersistentStore({ store: shopStore, domain: "shops", seed: INITIAL_SHOPS });

  const items = useSyncExternalStore(
    (cb) => shopStore.subscribe(cb),
    () => shopStore.getState() as readonly ShopRecord[],
    () => INITIAL_SHOPS as readonly ShopRecord[],
  );

  const [keyword, setKeyword] = useState("");
  const [mallFilter, setMallFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ShopRecord["status"]>("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((s) => {
      if (k && !`${s.name} ${s.code} ${s.mall}`.toLowerCase().includes(k)) return false;
      if (mallFilter !== "all" && s.mall !== mallFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, mallFilter, statusFilter]);

  const malls = Array.from(new Set(items.map((i) => i.mall)));

  const toggleStatus = (id: string) => {
    const shop = shopStore.findById(id);
    if (!shop) return;
    shopStore.upsert({
      ...shop,
      status: shop.status === "連携中" ? "停止中" : "連携中",
    });
  };

  const handleDelete = (id: string, name: string) => {
    shopStore.remove(id);
    toast.show(`${name} を削除しました`, "info");
  };

  const [reconnecting, setReconnecting] = useState<Record<string, boolean>>({});

  const reconnect = (id: string, name: string) => {
    const shop = shopStore.findById(id);
    if (!shop || reconnecting[id]) return;
    setReconnecting((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
      shopStore.upsert({ ...shop, status: "連携中", lastSync: "同期完了", lastSyncAt: stamp });
      setReconnecting((prev) => ({ ...prev, [id]: false }));
      toast.show(`${name} を再接続しました`, "success");
    }, 1200);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">店舗マスタ</h1>
            <HelpHint>
              連携モール・自社ECなど店舗ごとの基本情報・API認証・既定倉庫・送信元アドレスを管理します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            店舗別の連携状況と売上を一望し、設定変更・一時停止が可能。
          </p>
        </div>
        <Link href="/settings/shops/new">
          <PrimaryButton>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" />店舗を新規登録
            </span>
          </PrimaryButton>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録店舗</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            連携中 {items.filter((i) => i.status === "連携中").length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">エラー店舗</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {items.filter((i) => i.status === "エラー").length}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">要対応</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間売上合計</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ¥{items.reduce((s, i) => s + i.monthlySales, 0).toLocaleString()}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">月間受注合計</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {items.reduce((s, i) => s + i.monthlyOrders, 0).toLocaleString()}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="店舗名・コード・モール"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select
            value={mallFilter}
            onChange={(e) => setMallFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">モール: すべて</option>
            {malls.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
          >
            <option value="all">状態: すべて</option>
            <option value="連携中">連携中</option>
            <option value="エラー">エラー</option>
            <option value="停止中">停止中</option>
            <option value="未設定">未設定</option>
          </select>
          <SecondaryButton
            onClick={() => {
              setKeyword("");
              setMallFilter("all");
              setStatusFilter("all");
            }}
          >
            クリア
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">店舗名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">モール</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">認証</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終同期</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">月間売上</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">月間受注</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">既定倉庫</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.fromAddress}</div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.code}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
                    <span className="text-gray-700">{s.mall}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-600">{s.apiAuthType}</td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                      sb[s.status],
                    )}
                  >
                    {s.status === "連携中" && <CheckCircle2 className="h-3 w-3" />}
                    {s.status === "エラー" && <AlertCircle className="h-3 w-3" />}
                    {s.status === "未設定" && <Globe className="h-3 w-3" />}
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">
                  <div>{s.lastSync}</div>
                  <div className="text-[10px] text-gray-400">{s.lastSyncAt}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-blue-700">
                  {s.monthlySales > 0 ? `¥${s.monthlySales.toLocaleString()}` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">
                  {s.monthlyOrders > 0 ? s.monthlyOrders.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{s.defaultWarehouse}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex justify-center gap-1">
                    {s.status === "エラー" && (
                      <button
                        onClick={() => reconnect(s.id, s.name)}
                        disabled={reconnecting[s.id]}
                        className="p-1.5 rounded-lg bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 disabled:opacity-50"
                        title="再接続"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", reconnecting[s.id] && "animate-spin")} />
                      </button>
                    )}
                    <Link
                      href={`/settings/shops/${s.id}/edit`}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600"
                      title="編集"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => {
                        toggleStatus(s.id);
                        toast.show(`${s.name} を切替しました`, "info");
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-orange-500"
                      title="一時停止/再開"
                    >
                      {s.status === "連携中" ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
