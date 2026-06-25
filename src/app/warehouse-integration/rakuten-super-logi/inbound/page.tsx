"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, Plus, Search, Truck, X } from "lucide-react";
import { DetailModal, type DetailRow } from "@/components/ui/detail-modal";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  rslInboundStore,
  INITIAL_RSL_INBOUND,
  type RslInboundRecord,
} from "@/lib/stores/warehouse-rsl-inbound-store";

type Inbound = RslInboundRecord;

const sb: Record<string, string> = {
  予定: "bg-gray-500/15 text-gray-600",
  輸送中: "bg-blue-500/15 text-blue-700",
  RSL受入中: "bg-violet-500/15 text-violet-700",
  検品中: "bg-amber-500/15 text-amber-700",
  完了: "bg-emerald-500/15 text-emerald-700",
  差異あり: "bg-red-500/15 text-red-700",
};

type NewInboundForm = {
  poNo: string;
  supplier: string;
  qty: string;
  scheduled: Date | null;
};

const EMPTY_FORM: NewInboundForm = { poNo: "", supplier: "", qty: "", scheduled: null };

export default function RsrLogiInboundPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Inbound["status"]>("all");
  const [scheduledFilter, setScheduledFilter] = useState<Date | undefined>(undefined);

  // 永続化（domain: "warehouse-rsl-inbound-settings"）の正規オーナーページ。
  usePersistentStore({
    store: rslInboundStore,
    domain: "warehouse-rsl-inbound-settings",
    seed: INITIAL_RSL_INBOUND,
  });
  const items = useSyncExternalStore(
    rslInboundStore.subscribe,
    rslInboundStore.getState,
    rslInboundStore.getState,
  );

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewInboundForm>(EMPTY_FORM);
  const [detailRow, setDetailRow] = useState<Inbound | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const sched = scheduledFilter
      ? `${scheduledFilter.getFullYear()}/${String(scheduledFilter.getMonth() + 1).padStart(2, "0")}/${String(scheduledFilter.getDate()).padStart(2, "0")}`
      : null;
    return items.filter((d) => {
      if (k && !`${d.id} ${d.poNo} ${d.supplier} ${d.trackingNo}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (sched && d.scheduled !== sched) return false;
      return true;
    });
  }, [items, keyword, statusFilter, scheduledFilter]);

  function handleRegister() {
    if (!form.poNo.trim() || !form.supplier.trim() || !form.qty.trim()) {
      toast.show("発注番号・仕入先・数量は必須です", "error");
      return;
    }
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.show("数量は1以上の整数を入力してください", "error");
      return;
    }
    const now = new Date();
    const scheduledStr = form.scheduled
      ? `${form.scheduled.getFullYear()}/${String(form.scheduled.getMonth() + 1).padStart(2, "0")}/${String(form.scheduled.getDate()).padStart(2, "0")}`
      : `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    const newItem: Inbound = {
      id: `RSL-IN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(items.length + 1).padStart(3, "0")}`,
      poNo: form.poNo.trim(),
      supplier: form.supplier.trim(),
      items: 1,
      qty,
      scheduled: scheduledStr,
      arrived: "—",
      carrier: "—",
      trackingNo: "—",
      status: "予定",
      diff: 0,
    };
    rslInboundStore.upsert(newItem);
    setForm(EMPTY_FORM);
    setShowModal(false);
    toast.show("入荷予定を登録しました", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 入荷処理</h1>
            <HelpHint>RSL倉庫への入荷予定・実績を管理。発注書に紐付けて入荷予定を登録・取消・差異確認できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">発注書からRSLへの入荷予定を作成し、輸送・受入・検品の進捗を確認します。</p>
        </div>
        <PrimaryButton onClick={() => setShowModal(true)}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />入荷予定登録</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日入荷予定</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.filter((d) => d.scheduled === "2026/04/30").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">輸送中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{items.filter((d) => d.status === "輸送中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">検品中</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{items.filter((d) => d.status === "検品中" || d.status === "RSL受入中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">差異あり</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{items.filter((d) => d.status === "差異あり").length}</div>
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
              placeholder="入荷ID・発注番号・仕入先・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="入荷予定日" value={scheduledFilter} onChange={setScheduledFilter} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="予定">予定</option>
            <option value="輸送中">輸送中</option>
            <option value="RSL受入中">RSL受入中</option>
            <option value="検品中">検品中</option>
            <option value="完了">完了</option>
            <option value="差異あり">差異あり</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); setScheduledFilter(undefined); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">入荷ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">発注書</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">仕入先</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">SKU</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">予定日</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">到着</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送業者 / 送り状</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">差異</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.poNo}</td>
                <td className="px-3 py-2.5 text-gray-800">{d.supplier}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{d.items}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.scheduled}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{d.arrived}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700 inline-flex items-center gap-1"><Truck className="h-3 w-3" />{d.carrier}</div>
                  <div className="text-gray-400 font-mono">{d.trackingNo}</div>
                </td>
                <td className={cn("px-3 py-2.5 text-center tabular-nums text-xs", d.diff !== 0 ? "text-red-600 font-medium" : "text-gray-400")}>
                  {d.diff !== 0 ? d.diff : "—"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "完了" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "予定" && <Clock className="h-3 w-3" />}
                    {d.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => setDetailRow(d)} className="p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25" title="詳細">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">入荷予定登録</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="p-1.5 rounded-lg hover:bg-white/70 text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  発注番号 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.poNo}
                  onChange={(e) => setForm((prev) => ({ ...prev, poNo: e.target.value }))}
                  placeholder="PO-2026-XXXX"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  仕入先 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.supplier}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                  placeholder="メーカー・問屋名"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  数量 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.qty}
                  onChange={(e) => setForm((prev) => ({ ...prev, qty: e.target.value }))}
                  placeholder="例: 1200"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">入荷予定日</label>
                <DatePicker
                  placeholder="予定日を選択"
                  value={form.scheduled ?? undefined}
                  onChange={(d) => setForm((prev) => ({ ...prev, scheduled: d ?? null }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80"
              >
                キャンセル
              </button>
              <button
                onClick={handleRegister}
                className="px-4 py-2 rounded-xl text-sm bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90"
              >
                登録する
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailModal
        open={detailRow !== null}
        title="入荷明細の詳細"
        subtitle={detailRow?.id}
        rows={
          detailRow
            ? ([
                { label: "入荷ID", value: detailRow.id, mono: true },
                { label: "発注書", value: detailRow.poNo, mono: true },
                { label: "仕入先", value: detailRow.supplier },
                { label: "SKU数", value: `${detailRow.items} 件` },
                { label: "数量", value: `${detailRow.qty.toLocaleString()} 個` },
                { label: "予定日", value: detailRow.scheduled },
                { label: "到着", value: detailRow.arrived },
                { label: "配送業者", value: detailRow.carrier },
                { label: "送り状番号", value: detailRow.trackingNo, mono: true },
                {
                  label: "差異",
                  value: detailRow.diff !== 0 ? `${detailRow.diff} 個` : "なし",
                  tone: detailRow.diff !== 0 ? "danger" : "default",
                },
                {
                  label: "状態",
                  value: detailRow.status,
                  tone:
                    detailRow.status === "完了"
                      ? "success"
                      : detailRow.status === "差異あり"
                        ? "danger"
                        : detailRow.status === "検品中" || detailRow.status === "RSL受入中"
                          ? "warning"
                          : "default",
                },
              ] satisfies DetailRow[])
            : []
        }
        onClose={() => setDetailRow(null)}
      />
    </div>
  );
}
