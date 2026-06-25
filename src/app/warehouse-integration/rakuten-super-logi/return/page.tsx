"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Eye, Plus, Search, Undo2, X } from "lucide-react";
import { DetailModal, type DetailRow } from "@/components/ui/detail-modal";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  rslReturnStore,
  INITIAL_RSL_RETURN,
  type RslReturnRecord,
} from "@/lib/stores/warehouse-rsl-return-store";

type Return = RslReturnRecord;

const sb: Record<string, string> = {
  受付: "bg-blue-500/15 text-blue-700",
  返送中: "bg-violet-500/15 text-violet-700",
  RSL受領: "bg-amber-500/15 text-amber-700",
  検品中: "bg-orange-500/15 text-orange-700",
  在庫戻し済: "bg-emerald-500/15 text-emerald-700",
  廃棄処理済: "bg-rose-500/15 text-rose-700",
};

const resultBadge: Record<string, string> = {
  再販可: "bg-emerald-500/15 text-emerald-700",
  不良在庫: "bg-amber-500/15 text-amber-700",
  廃棄: "bg-red-500/15 text-red-700",
  "—": "bg-gray-500/10 text-gray-500",
};

type NewReturnForm = { orderNo: string; customer: string; product: string; qty: string; reason: string; };
const EMPTY_RETURN_FORM: NewReturnForm = { orderNo: "", customer: "", product: "", qty: "1", reason: "サイズ違い" };
const RETURN_REASONS = ["サイズ違い", "イメージ違い", "破損", "誤発送", "初期不良", "肌に合わない", "その他"];

export default function RsrLogiReturnPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Return["status"]>("all");
  const [receivedFilter, setReceivedFilter] = useState<Date | undefined>(undefined);

  // 永続化（domain: "warehouse-rsl-return-settings"）の正規オーナーページ。
  usePersistentStore({
    store: rslReturnStore,
    domain: "warehouse-rsl-return-settings",
    seed: INITIAL_RSL_RETURN,
  });
  const items = useSyncExternalStore(
    rslReturnStore.subscribe,
    rslReturnStore.getState,
    rslReturnStore.getState,
  );

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewReturnForm>(EMPTY_RETURN_FORM);
  const [detailRow, setDetailRow] = useState<Return | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    const recv = receivedFilter
      ? `${receivedFilter.getFullYear()}/${String(receivedFilter.getMonth() + 1).padStart(2, "0")}/${String(receivedFilter.getDate()).padStart(2, "0")}`
      : null;
    return items.filter((d) => {
      if (k && !`${d.id} ${d.orderNo} ${d.customer} ${d.trackingNo}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (recv && !d.receivedAt.startsWith(recv)) return false;
      return true;
    });
  }, [items, keyword, statusFilter, receivedFilter]);

  function handleRegister() {
    if (!form.orderNo.trim() || !form.customer.trim() || !form.product.trim()) {
      toast.show("受注番号・顧客名・商品名は必須です", "error");
      return;
    }
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.show("数量は1以上の整数を入力してください", "error");
      return;
    }
    const now = new Date();
    const newItem: Return = {
      id: `RSL-RET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(items.length + 1).padStart(3, "0")}`,
      orderNo: form.orderNo.trim(),
      customer: form.customer.trim(),
      product: form.product.trim(),
      qty,
      reason: form.reason,
      receivedAt: "—",
      inspectedAt: "—",
      result: "—",
      refund: 0,
      status: "受付",
      trackingNo: "—",
    };
    rslReturnStore.upsert(newItem);
    setForm(EMPTY_RETURN_FORM);
    setShowModal(false);
    toast.show("返品受付を登録しました", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 返品処理</h1>
            <HelpHint>RSLを経由した返品の入荷・検品・在庫戻しまでの一連の処理を管理。検品結果から自動で返金処理がトリガーされます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">楽天店受注の返品をRSLで受領・検品し、再販可・不良・廃棄の3区分で在庫を整理。</p>
        </div>
        <PrimaryButton onClick={() => setShowModal(true)}>
          <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />返品受付</span>
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">本日返品</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.filter((d) => d.receivedAt.startsWith("2026/04/30")).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">検品中</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{items.filter((d) => d.status === "検品中" || d.status === "RSL受領").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">在庫戻し済</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((d) => d.status === "在庫戻し済").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">返金合計</div>
          <div className="text-2xl font-bold text-red-600 mt-1">¥{items.reduce((s, d) => s + d.refund, 0).toLocaleString()}</div>
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
              placeholder="返品ID・受注番号・顧客名・送り状番号"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <DatePicker placeholder="受領日" value={receivedFilter} onChange={setReceivedFilter} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="受付">受付</option>
            <option value="返送中">返送中</option>
            <option value="RSL受領">RSL受領</option>
            <option value="検品中">検品中</option>
            <option value="在庫戻し済">在庫戻し済</option>
            <option value="廃棄処理済">廃棄処理済</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); setReceivedFilter(undefined); }}>クリア</SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">返品ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客 / 商品</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">RSL受領 / 検品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">検品結果</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">返金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{d.id}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700">{d.orderNo}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-800">{d.customer}</div>
                  <div className="text-xs text-gray-500">{d.product}</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{d.qty}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{d.reason}</td>
                <td className="px-3 py-2.5 text-xs">
                  <div className="text-gray-700">{d.receivedAt}</div>
                  <div className="text-gray-400">{d.inspectedAt}</div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", resultBadge[d.result])}>{d.result}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-red-600">¥{d.refund.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1", sb[d.status])}>
                    {d.status === "在庫戻し済" && <CheckCircle2 className="h-3 w-3" />}
                    {d.status === "受付" && <Clock className="h-3 w-3" />}
                    {d.status === "返送中" && <Undo2 className="h-3 w-3" />}
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
              <h2 className="text-lg font-bold text-gray-800">返品受付登録</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_RETURN_FORM); }} className="p-1.5 rounded-lg hover:bg-white/70 text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  受注番号 <span className="text-red-500">*</span>
                </label>
                <input value={form.orderNo} onChange={(e) => setForm((p) => ({ ...p, orderNo: e.target.value }))} placeholder="ORD-2026-XXXXX" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  顧客名 <span className="text-red-500">*</span>
                </label>
                <input value={form.customer} onChange={(e) => setForm((p) => ({ ...p, customer: e.target.value }))} placeholder="例: 田中 太郎" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  商品名 <span className="text-red-500">*</span>
                </label>
                <input value={form.product} onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))} placeholder="例: コットンTシャツ ホワイト M" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">数量</label>
                  <input value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} placeholder="1" className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">返品理由</label>
                  <select value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_RETURN_FORM); }} className="px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80">
                キャンセル
              </button>
              <button onClick={handleRegister} className="px-4 py-2 rounded-xl text-sm bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90">
                受付登録
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailModal
        open={detailRow !== null}
        title="返品明細の詳細"
        subtitle={detailRow?.id}
        rows={
          detailRow
            ? ([
                { label: "返品ID", value: detailRow.id, mono: true },
                { label: "受注番号", value: detailRow.orderNo, mono: true },
                { label: "顧客", value: detailRow.customer },
                { label: "商品", value: detailRow.product },
                { label: "数量", value: `${detailRow.qty} 個` },
                { label: "返品理由", value: detailRow.reason },
                { label: "RSL受領", value: detailRow.receivedAt },
                { label: "検品日時", value: detailRow.inspectedAt },
                {
                  label: "検品結果",
                  value: detailRow.result,
                  tone:
                    detailRow.result === "再販可"
                      ? "success"
                      : detailRow.result === "不良在庫"
                        ? "warning"
                        : detailRow.result === "廃棄"
                          ? "danger"
                          : "default",
                },
                { label: "返金額", value: `¥${detailRow.refund.toLocaleString()}`, tone: "danger" },
                { label: "送り状番号", value: detailRow.trackingNo, mono: true },
                {
                  label: "状態",
                  value: detailRow.status,
                  tone:
                    detailRow.status === "在庫戻し済"
                      ? "success"
                      : detailRow.status === "廃棄処理済"
                        ? "danger"
                        : detailRow.status === "検品中" || detailRow.status === "RSL受領"
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
