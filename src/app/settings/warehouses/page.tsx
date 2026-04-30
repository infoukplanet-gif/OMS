"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Box, Edit, MapPin, Phone, Plus, Search, Star, Trash2, Truck, User } from "lucide-react";

type Warehouse = {
  code: string;
  name: string;
  type: "自社倉庫" | "外部倉庫" | "ドロップシッピング";
  address: string;
  zipCode: string;
  phone: string;
  manager: string;
  capacity: number;
  occupancy: number;
  shopAssignment: string[];
  carrierAssignment: string;
  isDefault: boolean;
  enabled: boolean;
  cutoffTime: string;
  notes: string;
};

const initial: Warehouse[] = [
  { code: "WH-001", name: "東京本社倉庫", type: "自社倉庫", address: "東京都品川区東品川4-12-7", zipCode: "140-0002", phone: "03-1234-5678", manager: "山田 太郎", capacity: 12000, occupancy: 8420, shopAssignment: ["本店", "楽天店", "Amazon店"], carrierAssignment: "ヤマト運輸", isDefault: true, enabled: true, cutoffTime: "15:00", notes: "メイン拠点、即日出荷対応" },
  { code: "WH-002", name: "大阪倉庫", type: "自社倉庫", address: "大阪府大阪市住之江区南港北2-1-1", zipCode: "559-0034", phone: "06-1234-5678", manager: "佐藤 花子", capacity: 8000, occupancy: 5240, shopAssignment: ["本店", "Yahoo!店"], carrierAssignment: "佐川急便", isDefault: false, enabled: true, cutoffTime: "14:00", notes: "西日本配送拠点" },
  { code: "WH-003", name: "福岡倉庫", type: "自社倉庫", address: "福岡県福岡市東区箱崎ふ頭5-3-1", zipCode: "812-0051", phone: "092-123-4567", manager: "田中 健司", capacity: 4000, occupancy: 1820, shopAssignment: ["本店"], carrierAssignment: "佐川急便", isDefault: false, enabled: true, cutoffTime: "13:00", notes: "九州・沖縄配送" },
  { code: "WH-004", name: "楽天スーパーロジ（千葉）", type: "外部倉庫", address: "千葉県市川市塩浜2-15-1", zipCode: "272-0127", phone: "047-123-4567", manager: "RSL運営", capacity: 50000, occupancy: 22130, shopAssignment: ["楽天店"], carrierAssignment: "楽天指定", isDefault: false, enabled: true, cutoffTime: "12:00", notes: "RSL連携、楽天24時間出荷" },
  { code: "WH-005", name: "Amazon FBA（小田原）", type: "外部倉庫", address: "神奈川県小田原市鬼柳200", zipCode: "250-0875", phone: "0120-999-373", manager: "Amazon運営", capacity: 0, occupancy: 0, shopAssignment: ["Amazon店"], carrierAssignment: "Amazon", isDefault: false, enabled: true, cutoffTime: "—", notes: "FBA、自社直送のみ管理" },
  { code: "WH-006", name: "ドロップシップ（メーカーA）", type: "ドロップシッピング", address: "—", zipCode: "—", phone: "0120-555-444", manager: "メーカーA連携", capacity: 0, occupancy: 0, shopAssignment: ["本店", "楽天店"], carrierAssignment: "メーカー指定", isDefault: false, enabled: true, cutoffTime: "11:00", notes: "メーカー直送、当日12時締" },
  { code: "WH-007", name: "旧仙台倉庫（休止中）", type: "自社倉庫", address: "宮城県仙台市宮城野区港3-1-1", zipCode: "983-0001", phone: "022-999-9999", manager: "—", capacity: 2000, occupancy: 0, shopAssignment: [], carrierAssignment: "—", isDefault: false, enabled: false, cutoffTime: "—", notes: "2025年12月より休止中" },
];

const typeBadge: Record<string, string> = {
  自社倉庫: "bg-blue-500/15 text-blue-700",
  外部倉庫: "bg-violet-500/15 text-violet-700",
  ドロップシッピング: "bg-amber-500/15 text-amber-700",
};

export default function WarehousesPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((w) => {
      if (k && !`${w.code} ${w.name} ${w.address}`.toLowerCase().includes(k)) return false;
      if (typeFilter !== "all" && w.type !== typeFilter) return false;
      if (statusFilter === "enabled" && !w.enabled) return false;
      if (statusFilter === "disabled" && w.enabled) return false;
      return true;
    });
  }, [items, keyword, typeFilter, statusFilter]);

  const setDefault = (code: string) =>
    setItems((prev) => prev.map((w) => ({ ...w, isDefault: w.code === code })));

  const totalCapacity = useMemo(() => items.filter((i) => i.enabled && i.capacity > 0).reduce((s, i) => s + i.capacity, 0), [items]);
  const totalOccupancy = useMemo(() => items.filter((i) => i.enabled && i.capacity > 0).reduce((s, i) => s + i.occupancy, 0), [items]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">拠点・倉庫管理</h1>
            <HelpHint>自社倉庫・外部倉庫・ドロップシッピング拠点を管理。各拠点の稼働率・店舗割当・出荷締時刻を設定できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別の出荷拠点割当、外部倉庫（RSL/FBA等）連携情報をここで一元管理。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("新規拠点を追加します", "info")}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />拠点追加</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録拠点</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">稼働 {items.filter((i) => i.enabled).length} / 休止 {items.filter((i) => !i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">総保管能力</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{totalCapacity.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-0.5">パレット数</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">総稼働率</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">外部連携拠点</div>
          <div className="text-2xl font-bold text-violet-600 mt-1">{items.filter((i) => i.type !== "自社倉庫").length}</div>
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
              placeholder="拠点コード・名称・住所"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">種別: すべて</option>
            <option value="自社倉庫">自社倉庫</option>
            <option value="外部倉庫">外部倉庫</option>
            <option value="ドロップシッピング">ドロップシッピング</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="enabled">稼働中</option>
            <option value="disabled">休止中</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setTypeFilter("all"); setStatusFilter("all"); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <GlassCard key={w.code} className={cn(!w.enabled && "opacity-60")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{w.name}</h3>
                  {w.isDefault && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 font-mono">{w.code}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-medium", typeBadge[w.type])}>{w.type}</span>
                </div>
              </div>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", w.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/15 text-gray-500")}>
                {w.enabled ? "稼働中" : "休止"}
              </span>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div>〒{w.zipCode}</div>
                  <div>{w.address}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{w.phone}</div>
              <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" />{w.manager}</div>
              <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-gray-400" />締時刻 {w.cutoffTime} / {w.carrierAssignment}</div>
            </div>
            {w.capacity > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 inline-flex items-center gap-1"><Box className="h-3 w-3" />稼働率</span>
                  <span className="text-gray-700 font-medium">{Math.round((w.occupancy / w.capacity) * 100)}% （{w.occupancy.toLocaleString()} / {w.capacity.toLocaleString()}）</span>
                </div>
                <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                  <div className="h-full bg-blue-500/70" style={{ width: `${Math.min(100, (w.occupancy / w.capacity) * 100)}%` }} />
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {w.shopAssignment.length > 0 ? w.shopAssignment.map((s) => (
                <span key={s} className="px-1.5 py-0.5 rounded-md text-[10px] bg-blue-500/10 text-blue-700">{s}</span>
              )) : <span className="text-xs text-gray-400">店舗割当なし</span>}
            </div>
            {w.notes && <p className="mt-2 text-xs text-gray-500 italic">{w.notes}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => toast.show(`${w.name} を編集します`, "info")} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80 inline-flex items-center justify-center gap-1">
                <Edit className="h-3 w-3" />編集
              </button>
              {!w.isDefault && (
                <button onClick={() => { setDefault(w.code); toast.show(`${w.name} を既定拠点に設定`, "success"); }} className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20">
                  既定に設定
                </button>
              )}
              <button onClick={() => { setItems((p) => p.filter((x) => x.code !== w.code)); toast.show("拠点を削除しました", "info"); }} disabled={w.isDefault} className="px-2 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
