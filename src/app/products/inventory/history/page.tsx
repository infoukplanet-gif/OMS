"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Download, Package, ArrowUpRight, ArrowDownLeft, Settings2, History as HistoryIcon } from "lucide-react";

type Move = {
  id: number;
  date: string;
  sku: string;
  product: string;
  type: "入庫" | "出庫" | "調整" | "移動" | "棚卸差異";
  qty: number;
  ref: string;
  warehouse: string;
  by: string;
  before: number;
  after: number;
};

const MOVES: Move[] = [
  { id: 1, date: "2026-04-25 15:30", sku: "WEP-001-BK", product: "ワイヤレスイヤホン Pro / ブラック", type: "出庫", qty: -2, ref: "ORD-2026-00851", warehouse: "東京本社倉庫", by: "システム", before: 32, after: 30 },
  { id: 2, date: "2026-04-25 14:00", sku: "UCB-002", product: "USB-Cケーブル 2m", type: "出庫", qty: -3, ref: "ORD-2026-00851", warehouse: "東京本社倉庫", by: "システム", before: 11, after: 8 },
  { id: 3, date: "2026-04-25 10:00", sku: "MBT-004", product: "モバイルバッテリー 20000mAh", type: "入庫", qty: 50, ref: "PO-2026-0044", warehouse: "東京本社倉庫", by: "田中 花子", before: 2, after: 52 },
  { id: 4, date: "2026-04-24 16:00", sku: "CHG-007", product: "急速充電器 65W", type: "調整", qty: -3, ref: "棚卸差異", warehouse: "大阪倉庫", by: "佐藤 健", before: 70, after: 67 },
  { id: 5, date: "2026-04-24 09:00", sku: "PFS-005", product: "保護フィルム セット", type: "入庫", qty: 100, ref: "PO-2026-0043", warehouse: "東京本社倉庫", by: "システム", before: 20, after: 120 },
  { id: 6, date: "2026-04-23 17:30", sku: "TWS-006-BK", product: "完全ワイヤレスイヤホン / ブラック", type: "移動", qty: 20, ref: "MOV-2026-0008", warehouse: "東京本社倉庫", by: "鈴木 美咲", before: 0, after: 20 },
  { id: 7, date: "2026-04-23 11:42", sku: "TS-WH-M", product: "Tシャツ ホワイト M", type: "棚卸差異", qty: -2, ref: "STK-2026-0042", warehouse: "九州物流センター", by: "高橋 翔", before: 32, after: 30 },
  { id: 8, date: "2026-04-22 14:18", sku: "WEP-001-BK", product: "ワイヤレスイヤホン Pro / ブラック", type: "入庫", qty: 30, ref: "PO-2026-0042", warehouse: "東京本社倉庫", by: "システム", before: 4, after: 34 },
];

const TYPE_BADGE: Record<Move["type"], string> = {
  入庫: "bg-emerald-500/15 text-emerald-700",
  出庫: "bg-blue-500/15 text-blue-700",
  調整: "bg-orange-500/15 text-orange-700",
  移動: "bg-purple-500/15 text-purple-700",
  棚卸差異: "bg-red-500/15 text-red-700",
};

export default function InventoryHistoryPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("すべて");
  const [warehouseFilter, setWarehouseFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return MOVES.filter((m) => {
      if (k && !m.sku.toLowerCase().includes(k) && !m.product.toLowerCase().includes(k) && !m.ref.toLowerCase().includes(k)) return false;
      if (typeFilter !== "すべて" && m.type !== typeFilter) return false;
      if (warehouseFilter !== "すべて" && m.warehouse !== warehouseFilter) return false;
      return true;
    });
  }, [keyword, typeFilter, warehouseFilter]);

  const stats = {
    in: MOVES.filter((m) => m.type === "入庫").reduce((s, m) => s + m.qty, 0),
    out: MOVES.filter((m) => m.type === "出庫").reduce((s, m) => s + Math.abs(m.qty), 0),
    adjust: MOVES.filter((m) => m.type === "調整" || m.type === "棚卸差異").reduce((s, m) => s + Math.abs(m.qty), 0),
    move: MOVES.filter((m) => m.type === "移動").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">在庫変動履歴</h1>
            <HelpHint>
              入庫・出庫・調整・倉庫間移動・棚卸差異など、在庫数を変動させた全操作の履歴を表示します。{"\n"}
              監査・差異原因調査に利用します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">対象期間: 直近30日 ／ 表示: {filtered.length}件</p>
        </div>
        <button
          onClick={() => toast.show("CSVエクスポートを開始しました")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
        >
          <Download className="h-4 w-4" />CSVエクスポート
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><ArrowDownLeft className="h-4 w-4" />入庫数（30日）</div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.in}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><ArrowUpRight className="h-4 w-4" />出庫数（30日）</div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.out}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Settings2 className="h-4 w-4" />調整・差異</div>
          <p className="mt-2 text-3xl font-bold text-orange-700 tabular-nums">{stats.adjust}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Package className="h-4 w-4" />倉庫間移動</div>
          <p className="mt-2 text-3xl font-bold text-purple-700 tabular-nums">{stats.move}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="SKU・商品名・参照ID"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">変動種別</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "入庫", "出庫", "調整", "移動", "棚卸差異"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">倉庫</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/40 bg-white/30">
          <HistoryIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">在庫変動ログ</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">日時</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">SKU / 商品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">種別</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">変動</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">前/後</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">参照元</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">倉庫</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">担当</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{m.date}</td>
                <td className="px-3 py-2.5">
                  <p className="font-mono text-xs text-gray-600">{m.sku}</p>
                  <p className="text-xs text-gray-700">{m.product}</p>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_BADGE[m.type])}>{m.type}</span>
                </td>
                <td className="px-3 py-2.5 text-center font-medium tabular-nums">
                  {m.qty > 0 ? <span className="text-emerald-600">+{m.qty}</span> : <span className="text-red-600">{m.qty}</span>}
                </td>
                <td className="px-3 py-2.5 text-center text-xs tabular-nums text-gray-500">
                  {m.before} → <span className="font-medium text-gray-800">{m.after}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-700 text-xs font-mono">{m.ref}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{m.warehouse}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{m.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
