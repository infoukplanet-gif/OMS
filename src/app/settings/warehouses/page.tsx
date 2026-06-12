"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  getWarehouses,
  setDefaultWarehouse,
  upsertWarehouse,
  removeWarehouse,
  type WarehouseRecord,
} from "@/lib/settings/warehouse-settings";
import { Box, Edit, MapPin, Phone, Plus, Search, Star, Trash2, Truck, User, X } from "lucide-react";

const typeBadge: Record<string, string> = {
  自社倉庫: "bg-blue-500/15 text-blue-700",
  外部倉庫: "bg-violet-500/15 text-violet-700",
  ドロップシッピング: "bg-amber-500/15 text-amber-700",
};

const EMPTY_WAREHOUSE: WarehouseRecord = {
  code: "",
  name: "",
  type: "自社倉庫",
  address: "",
  zipCode: "",
  phone: "",
  manager: "",
  capacity: 0,
  occupancy: 0,
  shopAssignment: [],
  carrierAssignment: "ヤマト運輸",
  isDefault: false,
  enabled: true,
  cutoffTime: "15:00",
  notes: "",
};

const CARRIERS = ["ヤマト運輸", "佐川急便", "日本郵便", "ゆうパック", "西濃運輸", "福山通運", "楽天指定", "Amazon", "メーカー指定"];
const SHOPS = ["本店", "楽天店", "Yahoo!店", "Amazon店", "au PAY マーケット店", "Qoo10店"];

function WarehouseModal({
  warehouse,
  onSave,
  onClose,
}: {
  warehouse: WarehouseRecord | null;
  onSave: (w: WarehouseRecord) => void;
  onClose: () => void;
}) {
  const isEdit = warehouse !== null && warehouse.code !== "";
  const [form, setForm] = useState<WarehouseRecord>(warehouse ?? { ...EMPTY_WAREHOUSE });

  const set = (patch: Partial<WarehouseRecord>) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleShop = (shop: string) => {
    const next = form.shopAssignment.includes(shop)
      ? form.shopAssignment.filter((s) => s !== shop)
      : [...form.shopAssignment, shop];
    set({ shopAssignment: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <GlassCard className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 bg-white/30">
            <h2 className="text-base font-semibold text-gray-800">{isEdit ? "拠点を編集" : "拠点を新規追加"}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/60 text-gray-400">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">拠点コード <span className="text-red-500">*必須</span></label>
                <input
                  value={form.code}
                  onChange={(e) => set({ code: e.target.value })}
                  disabled={isEdit}
                  placeholder="例: WH-008"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">拠点名称 <span className="text-red-500">*必須</span></label>
                <input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="例: 名古屋倉庫"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">種別</label>
                <select value={form.type} onChange={(e) => set({ type: e.target.value as WarehouseRecord["type"] })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>自社倉庫</option>
                  <option>外部倉庫</option>
                  <option>ドロップシッピング</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">担当者名</label>
                <input value={form.manager} onChange={(e) => set({ manager: e.target.value })} placeholder="例: 鈴木 一郎" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">郵便番号</label>
                <input value={form.zipCode} onChange={(e) => set({ zipCode: e.target.value })} placeholder="000-0000" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">電話番号</label>
                <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="000-0000-0000" type="tel" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-gray-600">住所</label>
                <input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="例: 愛知県名古屋市港区ガーデンふ頭1-2-3" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">主配送業者</label>
                <select value={form.carrierAssignment} onChange={(e) => set({ carrierAssignment: e.target.value })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {CARRIERS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">出荷締時刻</label>
                <input value={form.cutoffTime} onChange={(e) => set({ cutoffTime: e.target.value })} placeholder="15:00" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">保管能力（パレット数）</label>
                <input type="number" value={form.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">現在稼働数（パレット）</label>
                <input type="number" value={form.occupancy} onChange={(e) => set({ occupancy: Number(e.target.value) })} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-gray-600">備考</label>
                <input value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="備考・メモ" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">担当店舗</label>
              <div className="grid grid-cols-3 gap-2">
                {SHOPS.map((s) => (
                  <label key={s} className={cn("flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors", form.shopAssignment.includes(s) ? "bg-blue-500/10 border border-blue-500/30" : "bg-white/40 border border-white/50 hover:bg-white/60")}>
                    <input type="checkbox" checked={form.shopAssignment.includes(s)} onChange={() => toggleShop(s)} className="rounded border-gray-300" />
                    <span className="text-xs text-gray-700">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => set({ enabled: !form.enabled })}
                  className={cn("relative w-9 h-5 rounded-full transition-colors cursor-pointer", form.enabled ? "bg-blue-500" : "bg-gray-200")}
                >
                  <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", form.enabled ? "translate-x-4 left-0.5" : "left-0.5")} />
                </div>
                <span className="text-sm text-gray-700">稼働中</span>
              </label>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-white/40 bg-white/30 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">キャンセル</button>
            <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
              {isEdit ? "更新" : "拠点を追加"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const toast = useToast();
  const [items, setItems] = useState<WarehouseRecord[]>(() => getWarehouses());
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");

  // モーダル制御: null=閉じ、EMPTY=新規、existing=編集
  const [modalWarehouse, setModalWarehouse] = useState<WarehouseRecord | null | false>(false);

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

  const handleSetDefault = (code: string) => {
    setDefaultWarehouse(code);
    setItems(getWarehouses());
    const w = items.find((x) => x.code === code);
    toast.show(`${w?.name ?? code} を既定拠点に設定`, "success");
  };

  const handleDelete = (code: string, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？この操作は元に戻せません。`)) return;
    removeWarehouse(code);
    setItems(getWarehouses());
    toast.show("拠点を削除しました", "info");
  };

  const handleSave = (w: WarehouseRecord) => {
    if (!w.code.trim() || !w.name.trim()) {
      toast.show("拠点コードと名称は必須です", "error");
      return;
    }
    upsertWarehouse(w);
    setItems(getWarehouses());
    setModalWarehouse(false);
    const isNew = !items.find((x) => x.code === w.code);
    toast.show(isNew ? `「${w.name}」を追加しました` : `「${w.name}」を更新しました`, "success");
  };

  const totalCapacity = useMemo(() => items.filter((i) => i.enabled && i.capacity > 0).reduce((s, i) => s + i.capacity, 0), [items]);
  const totalOccupancy = useMemo(() => items.filter((i) => i.enabled && i.capacity > 0).reduce((s, i) => s + i.occupancy, 0), [items]);

  return (
    <div className="space-y-5">
      {modalWarehouse !== false && (
        <WarehouseModal
          warehouse={modalWarehouse}
          onSave={handleSave}
          onClose={() => setModalWarehouse(false)}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">拠点・倉庫管理</h1>
            <HelpHint>自社倉庫・外部倉庫・ドロップシッピング拠点を管理。各拠点の稼働率・店舗割当・出荷締時刻を設定できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">店舗別の出荷拠点割当、外部倉庫（RSL/FBA等）連携情報をここで一元管理。</p>
        </div>
        <PrimaryButton onClick={() => setModalWarehouse({ ...EMPTY_WAREHOUSE })}>
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
              <button
                onClick={() => setModalWarehouse({ ...w, shopAssignment: [...w.shopAssignment] })}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs text-gray-700 bg-white/60 border border-white/50 hover:bg-white/80 inline-flex items-center justify-center gap-1"
              >
                <Edit className="h-3 w-3" />編集
              </button>
              {!w.isDefault && (
                <button
                  onClick={() => handleSetDefault(w.code)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs text-blue-700 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
                >
                  既定に設定
                </button>
              )}
              <button
                onClick={() => handleDelete(w.code, w.name)}
                disabled={w.isDefault}
                className="px-2 py-1.5 rounded-lg text-xs bg-red-500/15 text-red-700 hover:bg-red-500/25 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
