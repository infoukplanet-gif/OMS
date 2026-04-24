"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { ChevronDown, Printer, MoreHorizontal, Package, MapPin, CreditCard, StickyNote, Check, Copy, X, Trash2, Download, Mail } from "lucide-react";

const orderItems = [
  { name: "ワイヤレスイヤホン Pro", sku: "WEP-001", price: "¥12,800", qty: 2, subtotal: "¥25,600" },
  { name: "USB-Cケーブル 2m", sku: "UCB-002", price: "¥1,280", qty: 3, subtotal: "¥3,840" },
  { name: "保護フィルム セット", sku: "PFS-005", price: "¥1,580", qty: 1, subtotal: "¥1,580" },
];

type StatusKey = "新規受付" | "確認待ち" | "引当待ち" | "入金待ち" | "印刷待ち" | "出荷待ち" | "出荷済み" | "キャンセル";

const STATUSES: StatusKey[] = [
  "新規受付", "確認待ち", "引当待ち", "入金待ち", "印刷待ち", "出荷待ち", "出荷済み", "キャンセル",
];

const statusBadge: Record<StatusKey, string> = {
  新規受付: "bg-blue-500/15 text-blue-700",
  確認待ち: "bg-amber-500/15 text-amber-700",
  引当待ち: "bg-purple-500/15 text-purple-700",
  入金待ち: "bg-rose-500/15 text-rose-700",
  印刷待ち: "bg-cyan-500/15 text-cyan-700",
  出荷待ち: "bg-orange-500/15 text-orange-700",
  出荷済み: "bg-emerald-500/15 text-emerald-700",
  キャンセル: "bg-gray-500/15 text-gray-600",
};

type TimelineEntry = { status: StatusKey; date: string; by: string };

const initialTimeline: TimelineEntry[] = [
  { status: "新規受付", date: "2024/04/10 09:12", by: "システム" },
  { status: "確認待ち", date: "2024/04/10 09:30", by: "田中" },
  { status: "引当待ち", date: "2024/04/10 09:31", by: "自動" },
  { status: "出荷待ち", date: "2024/04/10 10:00", by: "システム" },
];

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function OrderDetailPage() {
  const [currentStatus, setCurrentStatus] = useState<StatusKey>("出荷待ち");
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);
  const [statusOpen, setStatusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function handleStatusChange(next: StatusKey) {
    if (next === currentStatus) {
      setStatusOpen(false);
      return;
    }
    setCurrentStatus(next);
    setTimeline((prev) => [...prev, { status: next, date: formatNow(), by: "田中" }]);
    setStatusOpen(false);
    setToast(`ステータスを「${next}」に変更しました`);
  }

  function handlePrint() {
    setToast("印刷ダイアログを開きます");
    setTimeout(() => window.print(), 200);
  }

  function handleMore(action: string) {
    setMoreOpen(false);
    setToast(`${action} を実行しました`);
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-gray-900/90 text-white text-sm shadow-lg backdrop-blur-xl border border-white/20 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-1">ダッシュボード &gt; 受注一覧 &gt; 受注詳細</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">#ORD-2024-00847</h1>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors", statusBadge[currentStatus])}>
              {currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => { setStatusOpen((v) => !v); setMoreOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
              >
                ステータス変更 <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", statusOpen && "rotate-180")} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-20">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-white/60 transition-colors",
                        s === currentStatus && "bg-blue-500/10"
                      )}
                    >
                      <span className="text-gray-800">{s}</span>
                      {s === currentStatus && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
              aria-label="印刷"
            >
              <Printer className="h-4 w-4" />
            </button>

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => { setMoreOpen((v) => !v); setStatusOpen(false); }}
                className="p-2 rounded-xl bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
                aria-label="その他"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-20">
                  <MenuItem icon={<Copy className="h-4 w-4" />} label="伝票を複製" onClick={() => handleMore("伝票を複製")} />
                  <MenuItem icon={<Download className="h-4 w-4" />} label="納品書ダウンロード" onClick={() => handleMore("納品書ダウンロード")} />
                  <MenuItem icon={<Mail className="h-4 w-4" />} label="確認メール再送" onClick={() => handleMore("確認メール再送")} />
                  <MenuItem icon={<X className="h-4 w-4" />} label="受注をキャンセル" onClick={() => { handleStatusChange("キャンセル"); }} />
                  <div className="border-t border-white/40" />
                  <MenuItem icon={<Trash2 className="h-4 w-4" />} label="受注を削除" danger onClick={() => handleMore("受注を削除")} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <GlassCard>
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />受注明細</h2>
            <div className="overflow-hidden rounded-xl border border-white/50">
              <table className="w-full text-sm">
                <thead><tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
                </tr></thead>
                <tbody>
                  {orderItems.map(i => (
                    <tr key={i.sku} className="border-t border-white/30 hover:bg-white/40">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{i.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.sku}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{i.price}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{i.qty}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800">{i.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-8"><span className="text-gray-500">小計</span><span className="w-24 text-gray-700">¥31,020</span></div>
              <div className="flex justify-end gap-8"><span className="text-gray-500">送料</span><span className="w-24 text-gray-700">¥800</span></div>
              <div className="flex justify-end gap-8"><span className="text-gray-500">消費税(10%)</span><span className="w-24 text-gray-700">¥3,182</span></div>
              <div className="flex justify-end gap-8 pt-1 border-t border-white/40"><span className="font-medium text-gray-800">合計</span><span className="w-24 font-bold text-gray-800 text-lg">¥35,002</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-base font-semibold text-gray-800 mb-4">ステータス履歴</h2>
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("h-3 w-3 rounded-full", i === timeline.length - 1 ? "bg-blue-500" : "bg-emerald-500")} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-800">{t.status}</p>
                    <p className="text-xs text-gray-500">{t.date} — {t.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-2 space-y-4">
          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />注文者情報</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500 w-16 inline-block">氏名</span><span className="text-gray-800 font-medium">山田太郎</span></div>
              <div><span className="text-gray-500 w-16 inline-block">メール</span><span className="text-gray-700">yamada@example.com</span></div>
              <div><span className="text-gray-500 w-16 inline-block">電話</span><span className="text-gray-700">090-1234-5678</span></div>
              <div><span className="text-gray-500 w-16 inline-block">住所</span><span className="text-gray-700">〒100-0001 東京都千代田区千代田1-1-1</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">配送情報</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500 w-16 inline-block">配送先</span><span className="text-gray-700">注文者と同じ</span></div>
              <div><span className="text-gray-500 w-16 inline-block">配送方法</span><span className="text-gray-700">ヤマト運輸</span></div>
              <div className="pt-2">
                <label className="text-gray-500 text-xs block mb-1">追跡番号</label>
                <input type="text" placeholder="追跡番号を入力..." className="w-full h-8 px-3 rounded-lg text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />支払情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">支払方法</span><span className="text-gray-800">クレジットカード</span></div>
              <div className="flex justify-between"><span className="text-gray-500">支払状態</span><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">入金済み</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><StickyNote className="h-4 w-4 text-gray-400" />社内メモ</h3>
            <textarea rows={3} placeholder="メモを入力..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 resize-none" />
            <button
              type="button"
              onClick={() => setToast("メモを保存しました")}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors"
            >
              保存
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/60 transition-colors",
        danger ? "text-red-600" : "text-gray-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
