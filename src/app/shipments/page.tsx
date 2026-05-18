"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  SHIPMENT_STATUSES,
  shipmentStatusBadge,
  transitionShipment,
  type ShipmentStatus,
  type ShipmentState,
} from "@/lib/state-machines/shipment";
import { onShipmentTransitioned } from "@/lib/events/shipment-handlers";
import { mailQueue, type MailJob } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { orderStore } from "@/lib/stores/orders";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileDown,
  FileText,
  CheckSquare,
} from "lucide-react";

type Shipment = ShipmentState & {
  id: string;
  customer: string;
  items: number;
  amount: number;
  carrier: string;
  shipDate: string;
  shop: string;
};

const shipment = (
  partial: Omit<Shipment, "orderIds"> & { orderIds?: string[] },
): Shipment => ({
  orderIds: partial.orderIds ?? [partial.id],
  ...partial,
});

const initial: Shipment[] = [
  shipment({ id: "ORD-2026-08855", customer: "井上 智美", items: 2, amount: 14_200, carrier: "ヤマト運輸", shipDate: "2026/05/02", status: "出荷指示作成", shop: "本店" }),
  shipment({ id: "ORD-2026-08854", customer: "斎藤 拓海", items: 1, amount: 5_900, carrier: "佐川急便", shipDate: "2026/05/02", status: "ピッキング待ち", shop: "楽天店" }),
  shipment({ id: "ORD-2026-08853", customer: "森田 静香", items: 4, amount: 38_700, carrier: "ヤマト運輸", shipDate: "2026/05/02", status: "ピッキング待ち", shop: "本店" }),
  shipment({ id: "ORD-2026-08852", customer: "石田 浩二", items: 3, amount: 21_600, carrier: "日本郵便", shipDate: "2026/05/01", status: "検品待ち", shop: "Amazon店" }),
  shipment({ id: "ORD-2026-08851", customer: "山田 太郎", items: 3, amount: 32_400, carrier: "ヤマト運輸", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" }),
  shipment({ id: "ORD-2026-08850", customer: "佐藤 花子", items: 1, amount: 8_900, carrier: "佐川急便", shipDate: "2026/04/30", status: "出荷待ち", shop: "楽天店" }),
  shipment({ id: "ORD-2026-08849", customer: "田中 一郎", items: 5, amount: 154_000, carrier: "ヤマト運輸", shipDate: "2026/04/30", status: "出荷待ち", shop: "本店" }),
  shipment({ id: "ORD-2026-08848", customer: "渡辺 美咲", items: 2, amount: 24_800, carrier: "日本郵便", shipDate: "2026/05/01", status: "出荷待ち", shop: "Yahoo!店" }),
  shipment({ id: "ORD-2026-08847", customer: "木村 健", items: 1, amount: 6_200, carrier: "ヤマト運輸", shipDate: "2026/05/01", status: "出荷待ち", shop: "本店" }),
  shipment({ id: "ORD-2026-08845", customer: "伊藤 大輔", items: 2, amount: 18_600, carrier: "日本郵便", trackingNumber: "JP1234567890", shipDate: "2026/04/29", status: "出荷済み", shop: "本店" }),
  shipment({ id: "ORD-2026-08844", customer: "中村 あかり", items: 1, amount: 3_200, carrier: "ヤマト運輸", trackingNumber: "3456-7890-1234", shipDate: "2026/04/29", status: "配送中", shop: "Amazon店" }),
  shipment({ id: "ORD-2026-08843", customer: "小林 修", items: 3, amount: 67_500, carrier: "佐川急便", trackingNumber: "5678-9012-3456", shipDate: "2026/04/28", status: "配送中", shop: "楽天店" }),
  shipment({ id: "ORD-2026-08842", customer: "高橋 涼", items: 4, amount: 88_400, carrier: "西濃運輸", trackingNumber: "9012-3456-7890", shipDate: "2026/04/28", status: "配送中", shop: "本店" }),
  shipment({ id: "ORD-2026-08840", customer: "松本 愛", items: 2, amount: 15_800, carrier: "ヤマト運輸", trackingNumber: "7890-1234-5678", shipDate: "2026/04/27", status: "配達完了", shop: "本店" }),
  shipment({ id: "ORD-2026-08839", customer: "木村 拓也", items: 1, amount: 4_200, carrier: "日本郵便", trackingNumber: "JP9876543210", shipDate: "2026/04/27", status: "配達完了", shop: "Yahoo!店" }),
  shipment({ id: "ORD-2026-08838", customer: "吉田 あゆみ", items: 2, amount: 12_300, carrier: "佐川急便", trackingNumber: "1357-2468-9876", shipDate: "2026/04/26", status: "配達完了", shop: "本店" }),
  shipment({ id: "ORD-2026-08837", customer: "原田 明", items: 1, amount: 4_800, carrier: "ヤマト運輸", shipDate: "2026/04/26", status: "キャンセル", shop: "Yahoo!店" }),
];

const carrierIcon: Record<string, { color: string; label: string }> = {
  ヤマト運輸: { color: "bg-green-500", label: "ヤ" },
  佐川急便: { color: "bg-blue-600", label: "佐" },
  日本郵便: { color: "bg-red-500", label: "郵" },
  西濃運輸: { color: "bg-amber-500", label: "西" },
  福山通運: { color: "bg-indigo-500", label: "福" },
};

type TabValue = "all" | ShipmentStatus;

const carriers = ["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"];

export default function ShipmentsPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [activeTab, setActiveTab] = useState<TabValue>("出荷待ち");
  const [selected, setSelected] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [shipDateFilter, setShipDateFilter] = useState("");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((s) => {
      if (activeTab !== "all" && s.status !== activeTab) return false;
      if (k && !`${s.id} ${s.customer}`.toLowerCase().includes(k)) return false;
      if (carrierFilter !== "all" && s.carrier !== carrierFilter) return false;
      if (shipDateFilter && s.shipDate !== shipDateFilter) return false;
      return true;
    });
  }, [items, activeTab, keyword, carrierFilter, shipDateFilter]);

  const countByStatus = useMemo(() => {
    const map = new Map<ShipmentStatus, number>();
    for (const status of SHIPMENT_STATUSES) map.set(status, 0);
    for (const s of items) map.set(s.status, (map.get(s.status) ?? 0) + 1);
    return map;
  }, [items]);

  const tabs: { label: string; value: TabValue; count: number }[] = [
    { label: "すべて", value: "all", count: items.length },
    ...SHIPMENT_STATUSES.map((s) => ({
      label: s,
      value: s as TabValue,
      count: countByStatus.get(s) ?? 0,
    })),
  ];

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((s) => s.id)));

  const updateTracking = (id: string, trackingNumber: string) =>
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, trackingNumber } : s)));

  /**
   * 選択中の出荷を一括キャンセル。
   * - shipment SM の cancel ガード (出荷済み/キャンセル を除く) で skipped をカウント
   * - onShipmentTransitioned の cascadeOrderAction (cancel) / releaseInventory を集計し toast 表示
   * - orderStatusAtCancel は v1 では Shipment 側に保持していないため undefined（cascadeOrderAction は基本来ない想定）
   *   実 cascade は B フェーズの shared store 統合後に有効化
   */
  const cancelShipping = () => {
    if (selected.length === 0) {
      toast.show("キャンセルする出荷を選択してください", "error");
      return;
    }
    let cancelled = 0;
    let cascadeApplied = 0;
    let cascadeSkipped = 0;
    let releaseCount = 0;

    setItems((prev) =>
      prev.map((s) => {
        if (!selected.includes(s.id)) return s;
        const next = transitionShipment(s, "cancel");
        if (next === s) return s;

        // shared orderStore に Order がいれば、その時点の status を渡してカスケード判定
        const sharedOrder = orderStore
          .getState()
          .find((o) => o.id === next.orderIds[0]);
        const effects = onShipmentTransitioned(s, next, {
          orderStatusAtCancel: sharedOrder?.status,
        });

        if (effects.cascadeOrderAction && sharedOrder) {
          const r = orderStore.applyTransition(
            effects.cascadeOrderAction.orderId,
            effects.cascadeOrderAction.action,
          );
          if (r.applied) cascadeApplied += 1;
          else cascadeSkipped += 1;
        }
        if (effects.releaseInventory) releaseCount += 1;
        cancelled += 1;
        return next;
      }),
    );

    if (cancelled === 0) {
      toast.show("選択した出荷は出荷済み/キャンセル済みのためキャンセルできません", "error");
      setSelected([]);
      return;
    }

    const detail = [
      cascadeApplied > 0 ? `受注キャンセル連鎖 ${cascadeApplied}件` : "",
      cascadeSkipped > 0 ? `カスケード ${cascadeSkipped}件スキップ` : "",
      releaseCount > 0 ? `在庫戻し ${releaseCount}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const tail = detail ? ` / ${detail}` : "";

    toast.show(`${cancelled} 件の出荷をキャンセルしました${tail}`, "success");
    setSelected([]);
  };

  const confirmShipping = () => {
    if (selected.length === 0) {
      toast.show("出荷確定する受注を選択してください", "error");
      return;
    }
    let succeeded = 0;
    let cascadeApplied = 0;
    let cascadeSkipped = 0;
    const mailJobs: MailJob[] = [];

    setItems((prev) =>
      prev.map((s) => {
        if (!selected.includes(s.id)) return s;
        const next = transitionShipment(s, "confirmShipment", {
          trackingNumber: s.trackingNumber,
        });
        if (next === s) return s;

        const effects = onShipmentTransitioned(s, next);
        if (effects.sendMail) mailJobs.push(effects.sendMail);

        // cascadeOrderAction (registerShipment) を shared orderStore に流す
        if (effects.cascadeOrderAction) {
          const r = orderStore.applyTransition(
            effects.cascadeOrderAction.orderId,
            effects.cascadeOrderAction.action,
          );
          if (r.applied) cascadeApplied += 1;
          else cascadeSkipped += 1;
        }
        succeeded += 1;
        return next;
      }),
    );

    if (succeeded === 0) {
      toast.show("選択した出荷は出荷待ち状態ではないため確定できません", "error");
      setSelected([]);
      return;
    }

    const mailResult = mailQueue.enqueueAll(mailJobs, getAutoMailEnabled());
    const mailDetail = [
      mailResult.enqueued > 0 ? `enqueue ${mailResult.enqueued}件` : "",
      mailResult.duplicateSkipped > 0 ? `重複 ${mailResult.duplicateSkipped}件` : "",
      mailResult.disabledSkipped > 0 ? `無効化 ${mailResult.disabledSkipped}件` : "",
    ]
      .filter(Boolean)
      .join("・");
    const mailLine = mailDetail ? ` / 出荷通知メール ${mailDetail}` : "";

    const cascadeLine =
      cascadeApplied + cascadeSkipped > 0
        ? ` / 受注連鎖 ${cascadeApplied}件適用${cascadeSkipped > 0 ? `・${cascadeSkipped}件スキップ` : ""}`
        : "";

    toast.show(`${succeeded} 件を出荷確定しました${cascadeLine}${mailLine}`, "success");
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">出荷管理</h1>
          <HelpHint>受注ステータスごとに出荷待ち→出荷済み→配送中→配達完了を管理。検索・配送業者・出荷予定日で絞込み、選択した受注を一括で出荷確定できます。</HelpHint>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.show("出荷指示書を発行します", "info")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileText className="h-4 w-4" />
            出荷指示書
          </button>
          <button onClick={() => toast.show("納品書を発行します", "info")} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all")}>
            <FileDown className="h-4 w-4" />
            納品書
          </button>
          <button onClick={confirmShipping} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all")}>
            <CheckSquare className="h-4 w-4" />
            一括出荷確定
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelected([]); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              activeTab === tab.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
            )}>
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="受注番号・顧客名で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            )}
          />
        </div>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">配送方法: すべて</option>
          {carriers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <DatePicker
          compact
          placeholder="出荷予定日"
          onChange={(d) => {
            if (!d) { setShipDateFilter(""); return; }
            setShipDateFilter(`${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`);
          }}
        />
        {(keyword || carrierFilter !== "all" || shipDateFilter) && (
          <button
            onClick={() => { setKeyword(""); setCarrierFilter("all"); setShipDateFilter(""); }}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70"
          >
            クリア
          </button>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">受注番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">店舗</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">商品数</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">配送方法</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">追跡番号</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出荷予定日</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const c = carrierIcon[s.carrier];
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-t border-white/30 transition-colors",
                      selected.includes(s.id) ? "bg-blue-500/5" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link href={`/orders/${s.id}/edit`} className="font-medium text-blue-600 hover:underline">{s.id}</Link>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{s.customer}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{s.shop}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{s.items}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">¥{s.amount.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {c && (
                          <span className={cn("h-5 w-5 rounded text-[10px] font-bold text-white flex items-center justify-center", c.color)}>
                            {c.label}
                          </span>
                        )}
                        <span className="text-gray-600 text-xs">{s.carrier}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {s.trackingNumber ? (
                        <span className="font-mono text-xs text-gray-600">{s.trackingNumber}</span>
                      ) : (
                        <input
                          value={s.trackingNumber ?? ""}
                          onChange={(e) => updateTracking(s.id, e.target.value)}
                          type="text"
                          placeholder="番号を入力..."
                          className={cn(
                            "w-full h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50",
                            "placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                          )}
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{s.shipDate}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", shipmentStatusBadge[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/orders/${s.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="詳細">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-12 text-center text-sm text-gray-400">該当する受注がありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/40 bg-white/30">
          <div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">{selected.length} 件選択中</span>
                <button onClick={confirmShipping} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">
                  出荷確定
                </button>
                <button onClick={() => toast.show(`${selected.length} 件の配送番号を一括登録します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 transition-colors">
                  配送番号一括登録
                </button>
                <button onClick={() => toast.show(`${selected.length} 件の出荷指示書を発行します`, "info")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">
                  出荷指示書
                </button>
                <button
                  onClick={cancelShipping}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 transition-colors"
                  title="shipment SM の cancel ガードに従って一括キャンセル"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} 件 / 全 {items.length} 件</span>
            <div className="flex gap-1">
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-400">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg bg-white/50 border border-white/40 text-gray-600 hover:bg-white/70 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
