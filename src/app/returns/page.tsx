"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  RETURN_STATUSES,
  returnStatusBadge,
  type ReturnStatus,
} from "@/lib/state-machines/return";
import { returnStore, type ReturnRecord } from "@/lib/stores/return";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { inventoryStore } from "@/lib/stores/inventory";
import { paymentStore } from "@/lib/stores/payment";
import { INITIAL_RETURNS } from "@/lib/seeds/returns";
import { INITIAL_INVENTORY } from "@/lib/seeds/inventory";
import { INITIAL_PAYMENTS } from "@/lib/seeds/payments";
import { Search, RotateCcw, PackageCheck, Undo2, CircleDollarSign } from "lucide-react";

type ReturnRow = ReturnRecord & {
  customer: string;
  reason: string;
  requestedAt: string;
};

type TabValue = "all" | ReturnStatus;

const yen = (n: number) => `¥${n.toLocaleString()}`;
const lineQty = (r: ReturnRecord) => r.lines.reduce((s, l) => s + l.qty, 0);

const refundBadge: Record<string, string> = {
  未起票: "bg-gray-500/10 text-gray-500",
  起票済: "bg-amber-500/15 text-amber-700",
  確定済: "bg-emerald-500/15 text-emerald-700",
};

export default function ReturnsPage() {
  const toast = useToast();

  // 返品ドメインの正規オーナーページ: 初回 restore → なければ seed、変更を debounce 永続化。
  usePersistentStore({
    store: returnStore,
    domain: "returns",
    seed: INITIAL_RETURNS,
  });
  // inventory / payment は各自のオーナーページが永続化する。ここでは returns から
  // 先に入っても在庫戻し・返金が着地するための防御的シードのみ。
  useEffect(() => {
    if (inventoryStore.getState().length === 0) {
      inventoryStore.setItems(INITIAL_INVENTORY);
    }
    if (paymentStore.getState().length === 0) {
      paymentStore.setItems(INITIAL_PAYMENTS);
    }
  }, []);

  const storeItems = useSyncExternalStore(
    (cb) => returnStore.subscribe(cb),
    () => returnStore.getState(),
    () => INITIAL_RETURNS,
  );
  const items = storeItems as ReadonlyArray<ReturnRow>;

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [keyword, setKeyword] = useState("");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (k && !`${r.id} ${r.orderId} ${r.customer} ${r.reason}`.toLowerCase().includes(k)) {
        return false;
      }
      return true;
    });
  }, [items, activeTab, keyword]);

  const kpi = useMemo(() => {
    const open = items.filter((r) => r.status === "返品依頼" || r.status === "返品承認").length;
    const inspecting = items.filter((r) => r.status === "検品中").length;
    const refundPending = items.filter((r) => r.refundStatus === "起票済");
    const refundPendingAmount = refundPending.reduce((s, r) => s + r.refundAmount, 0);
    const completed = items.filter((r) => r.status === "返品完了").length;
    return {
      open,
      inspecting,
      refundPendingCount: refundPending.length,
      refundPendingAmount,
      completed,
    };
  }, [items]);

  const tabs: { value: TabValue; label: string; count: number }[] = useMemo(
    () => [
      { value: "all", label: "すべて", count: items.length },
      ...RETURN_STATUSES.map((s) => ({
        value: s,
        label: s,
        count: items.filter((r) => r.status === s).length,
      })),
    ],
    [items],
  );

  /** 返品依頼 → 返品承認 */
  const approve = (r: ReturnRow) => {
    if (!returnStore.applyTransition(r.id, "approve").applied) return;
    toast.show(`${r.id} を承認しました（返送先を案内）`, "success");
  };

  /** 返品依頼 / 検品中 → 却下 */
  const reject = (r: ReturnRow) => {
    if (!returnStore.applyTransition(r.id, "reject").applied) return;
    toast.show(`${r.id} を却下しました`, "info");
  };

  /** 返品承認 → 検品中（返送品到着） */
  const receive = (r: ReturnRow) => {
    if (!returnStore.applyTransition(r.id, "receiveItems").applied) return;
    toast.show(`${r.id} の返送品を受領、検品を開始します`, "info");
  };

  /**
   * 検品中 → 返品完了。
   * allGood=true: 全数良品判定（qty 全量を在庫へ戻す）
   * allGood=false: 全数不良（在庫戻しなし）
   * 返品完了で handler が restockInventory / refundPayment を emit:
   *   - restock は inventoryStore.applyReceive で onHand 加算（検品OK分のみ）
   *   - 返金は自動起票（refundStatus=起票済）し、実行は手動確定（confirmRefund）に委ねる
   */
  const complete = (r: ReturnRow, allGood: boolean) => {
    const inspectedGoodQty = allGood
      ? r.lines.map((l) => ({ sku: l.sku, warehouse: l.warehouse, goodQty: l.qty }))
      : [];
    const result = returnStore.applyTransition(r.id, "completeInspection", { inspectedGoodQty });
    if (!result.applied) return;

    let restockLine = "";
    if (result.effects.restockInventory) {
      const res = inventoryStore.applyReceive(result.effects.restockInventory.lines);
      const restocked = result.effects.restockInventory.lines.reduce((s, l) => s + l.qty, 0);
      restockLine = ` / 在庫戻し ${restocked}点（${res.appliedCount}SKU）`;
      if (res.unknownReceipts.length > 0) {
        restockLine += `・未登録SKU ${res.unknownReceipts.length}件`;
      }
    }
    const refundLine = result.effects.refundPayment
      ? ` / 返金 ${yen(result.effects.refundPayment.amount)} を起票`
      : "";
    toast.show(`${r.id} を返品完了にしました${restockLine}${refundLine}`, "success");
  };

  /**
   * 返金確定（手動）。起票済の返品に対し、元受注の入金伝票へ返金（applyCancel）を適用し、
   * refundStatus を確定済に更新する。入金伝票が無い場合も確定済にして記録だけ残す。
   */
  const confirmRefund = (r: ReturnRow) => {
    const pay = paymentStore.getState().find((p) => p.orderId === r.orderId);
    let detail = "（入金伝票なし・記録のみ）";
    if (pay) {
      const amount = Math.min(r.refundAmount, pay.paidAmount);
      if (amount > 0) {
        const res = paymentStore.applyCancel(pay.id, amount);
        if (res.applied) detail = `（入金 ${pay.id} から ${yen(amount)} を返金）`;
      } else {
        detail = "（入金残額なし）";
      }
    }
    if (!returnStore.markRefundConfirmed(r.id)) return;
    toast.show(`${r.id} の返金を確定しました ${detail}`, "success");
  };

  const clearFilter = () => {
    setKeyword("");
    setActiveTab("all");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">返品管理</h1>
          <HelpHint>
            顧客返品（RMA）の逆フローを管理します。返品依頼→承認→返送品受領→検品→返品完了。
            検品で良品判定した数量だけ在庫へ自動で戻し、返金を自動起票します。返金の実行は入金確定の手動操作です。
          </HelpHint>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <RotateCcw className="h-4 w-4" />
            未処理（依頼・承認）
          </div>
          <div className="mt-1.5 text-2xl font-bold text-gray-800">{kpi.open}</div>
          <div className="text-xs text-gray-400">件の対応待ち</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <PackageCheck className="h-4 w-4" />
            検品中
          </div>
          <div className="mt-1.5 text-2xl font-bold text-amber-700">{kpi.inspecting}</div>
          <div className="text-xs text-gray-400">良品判定で在庫戻し</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <CircleDollarSign className="h-4 w-4" />
            返金待ち（起票済）
          </div>
          <div className="mt-1.5 text-2xl font-bold text-rose-700">{kpi.refundPendingCount}</div>
          <div className="text-xs text-gray-400">合計 {yen(kpi.refundPendingAmount)}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <Undo2 className="h-4 w-4" />
            返品完了
          </div>
          <div className="mt-1.5 text-2xl font-bold text-emerald-700">{kpi.completed}</div>
          <div className="text-xs text-gray-400">今期の処理済み</div>
        </GlassCard>
      </div>

      {/* タブ */}
      <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
              activeTab === tab.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-md text-xs",
                activeTab === tab.value
                  ? "bg-blue-500/15 text-blue-700 font-medium"
                  : "bg-gray-500/10 text-gray-500",
              )}
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* 検索 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="RMA番号・受注番号・顧客名・理由で検索..."
            className={cn(
              "w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            )}
          />
        </div>
        {(keyword || activeTab !== "all") && (
          <button
            onClick={clearFilter}
            className="h-9 px-3 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 text-gray-600 hover:bg-white/70"
          >
            クリア
          </button>
        )}
      </div>

      {/* テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-white/50">
                <th className="px-4 py-3 font-medium">RMA番号 / 受注</th>
                <th className="px-4 py-3 font-medium">顧客</th>
                <th className="px-4 py-3 font-medium">返品理由</th>
                <th className="px-4 py-3 font-medium text-right">点数</th>
                <th className="px-4 py-3 font-medium text-right">返金予定</th>
                <th className="px-4 py-3 font-medium">ステータス</th>
                <th className="px-4 py-3 font-medium">返金</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    該当する返品はありません
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/30 hover:bg-white/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.id}</div>
                    <div className="text-xs text-gray-400">{r.orderId} ・ {r.requestedAt}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.customer}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{lineQty(r)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.refundAmount > 0 ? yen(r.refundAmount) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", returnStatusBadge[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.refundStatus && r.refundStatus !== "未起票" ? (
                      <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", refundBadge[r.refundStatus])}>
                        {r.refundStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === "返品依頼" && (
                        <>
                          <button onClick={() => approve(r)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors">承認</button>
                          <button onClick={() => reject(r)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors">却下</button>
                        </>
                      )}
                      {r.status === "返品承認" && (
                        <button onClick={() => receive(r)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 transition-colors">返送品を受領</button>
                      )}
                      {r.status === "検品中" && (
                        <>
                          <button onClick={() => complete(r, true)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 transition-colors">検品OK→完了</button>
                          <button onClick={() => complete(r, false)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 transition-colors">全数不良→完了</button>
                          <button onClick={() => reject(r)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25 transition-colors">却下</button>
                        </>
                      )}
                      {r.status === "返品完了" && r.refundStatus === "起票済" && (
                        <button onClick={() => confirmRefund(r)} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 transition-colors">返金確定</button>
                      )}
                      {r.status === "返品完了" && r.refundStatus === "確定済" && (
                        <span className="text-xs text-emerald-600">返金済み</span>
                      )}
                      {r.status === "却下" && <span className="text-xs text-gray-300">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <p className="text-xs text-gray-400 px-1">
        返品完了で良品分の在庫を自動加算し、返金を起票します。返金の実行（入金伝票への反映）は「返金確定」の手動操作で行われます。
      </p>
    </div>
  );
}
