"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton, SecondaryButton, Modal } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Search, Plus, AlertTriangle, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import { defectiveStore } from "@/lib/stores/defective";
import { runDefectiveTransfer } from "@/lib/cascades/run-transfer-defective";
import { INITIAL_DEFECTIVE } from "@/lib/seeds/defective";
import type { DefectiveRecord, DefectiveStatus } from "@/lib/state-machines/defective";

const STATUS_BADGE: Record<DefectiveStatus, string> = {
  "承認待ち": "bg-blue-500/15 text-blue-700",
  "振替待ち": "bg-amber-500/15 text-amber-700",
  "振替完了": "bg-emerald-500/15 text-emerald-700",
  "却下": "bg-red-500/15 text-red-700",
};

const FROM_WAREHOUSES = ["東京本社倉庫", "大阪倉庫", "九州物流センター", "名古屋配送センター"];
const TO_ROUTES = ["返品倉庫", "メーカー返却", "アウトレット在庫", "廃棄"];

const BLANK_FORM = {
  order: "",
  product: "",
  sku: "",
  qty: 1,
  reason: "",
  warehouse: "東京本社倉庫",
  route: "返品倉庫",
  registeredBy: "",
};

function nowString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}`;
}

export default function ShipmentsDefectivePage() {
  const toast = useToast();

  // shipments/defective が defective ストアの正規オーナー（永続化はここで 1 回だけ張る）。
  usePersistentStore({
    store: defectiveStore,
    domain: "defective",
    seed: INITIAL_DEFECTIVE,
  });

  const rows = useSyncExternalStore(
    (cb) => defectiveStore.subscribe(cb),
    () => defectiveStore.getState(),
    () => INITIAL_DEFECTIVE,
  );

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k) && !r.product.toLowerCase().includes(k)) return false;
      if (statusFilter !== "すべて" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, keyword, statusFilter]);

  // 承認待ち → 振替待ち（承認）/ 却下。状態機械経由（直接書き換えない）。
  const approve = (id: string) => {
    const res = defectiveStore.applyTransition(id, "approve");
    if (res.applied) toast.show(`${id} を承認しました（振替待ち）`, "success");
    else toast.show(`${id} は承認できない状態です`, "error");
  };

  const reject = (id: string) => {
    const res = defectiveStore.applyTransition(id, "reject");
    if (res.applied) toast.show(`${id} を却下しました`, "info");
    else toast.show(`${id} は却下できない状態です`, "error");
  };

  // 振替待ち → 振替完了。cascade glue 経由で良品 onHand を実減算する。
  const execute = (id: string) => {
    const res = runDefectiveTransfer({ id });
    if (!res.applied) {
      toast.show(`${id} は振替実行できない状態です（承認後に実行してください）`, "error");
      return;
    }
    if (res.unknownInventory) {
      toast.show(
        `${id} を振替完了にしました（対象在庫が見つからず onHand は未更新）`,
        "info",
      );
      return;
    }
    toast.show(
      `${id} の振替を実行しました（良品在庫を ${res.qty}点 減算）`,
      "success",
    );
  };

  function handleNewSubmit() {
    if (!form.order.trim()) { toast.show("受注番号を入力してください", "error"); return; }
    if (!form.product.trim()) { toast.show("商品名を入力してください", "error"); return; }
    if (!form.sku.trim()) { toast.show("SKUを入力してください", "error"); return; }
    if (form.qty < 1) { toast.show("数量は1以上を入力してください", "error"); return; }
    if (!form.reason.trim()) { toast.show("振替理由を入力してください", "error"); return; }
    const id = `DF-${String(rows.length + 1).padStart(3, "0")}`;
    const newRow: DefectiveRecord = {
      id,
      order: form.order.trim(),
      product: form.product.trim(),
      sku: form.sku.trim(),
      warehouse: form.warehouse,
      qty: form.qty,
      reason: form.reason.trim(),
      route: form.route,
      source: "manual",
      registeredAt: nowString(),
      registeredBy: form.registeredBy.trim() || "—",
      status: "承認待ち",
    };
    const res = defectiveStore.register(newRow);
    if (!res.applied) {
      toast.show(`${id} は既に登録済みです`, "error");
      return;
    }
    toast.show(`${id} を登録しました（承認待ち）`, "success");
    setNewModalOpen(false);
    setForm(BLANK_FORM);
  }

  const stats = {
    waiting: rows.filter((r) => r.status === "振替待ち" || r.status === "承認待ち").length,
    done: rows.filter((r) => r.status === "振替完了").length,
    qty: rows.filter((r) => r.status !== "却下").reduce((s, r) => s + r.qty, 0),
    rejected: rows.filter((r) => r.status === "却下").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">不良品振替</h1>
            <HelpHint>
              不良品を良品倉庫から返品倉庫・メーカー返却・アウトレット在庫へ振り替えます。{"\n"}
              承認後に振替を実行すると、振替元倉庫の良品在庫数（onHand）を数量分だけ自動で減算します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未振替: <span className="font-semibold text-amber-700">{stats.waiting}件</span> ／ 累計振替数量:{" "}
            <span className="font-semibold">{stats.qty}点</span>
          </p>
        </div>
        <PrimaryButton onClick={() => { setForm(BLANK_FORM); setNewModalOpen(true); }}>
          <Plus className="h-4 w-4" />新規振替登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">処理待ち</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.waiting}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">振替完了</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.done}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象数量合計</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.qty}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">却下件数</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.rejected}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・SKU・商品名"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">状態</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "承認待ち", "振替待ち", "振替完了", "却下"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">数量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">理由</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">振替ルート</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">登録</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {r.id}
                  {r.source === "stocktake" && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 text-[10px] font-medium">棚卸減耗</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-blue-600">{r.order}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-800">{r.product}</p>
                  <p className="text-[10px] font-mono text-gray-500">{r.sku}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{r.qty}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">{r.reason}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">
                  <span>{r.warehouse}</span>
                  <ArrowRightLeft className="inline-block h-3 w-3 mx-1 text-gray-400" />
                  <span className="font-medium">{r.route}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  <p className="tabular-nums">{r.registeredAt}</p>
                  <p>{r.registeredBy}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_BADGE[r.status])}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.status === "承認待ち" ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => approve(r.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                      >
                        承認
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25"
                      >
                        却下
                      </button>
                    </div>
                  ) : r.status === "振替待ち" ? (
                    <button
                      onClick={() => execute(r.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                    >
                      振替実行
                    </button>
                  ) : (
                    <CheckCircle2 className="inline-block h-4 w-4 text-emerald-500" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">振替で連動する処理</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "振替実行時に振替元倉庫の良品在庫（onHand）を −数量",
            "棚卸の負差異（減耗）はこの台帳に「棚卸減耗」として記録",
            "承認 → 振替実行の二段階フロー（承認待ち／振替待ち）",
            "対象在庫が見つからない場合は台帳のみ更新し在庫は据え置き",
            "振替元・振替先・操作者・日時・理由を台帳に保存",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* 新規振替登録モーダル */}
      <Modal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="新規振替登録"
        footer={
          <>
            <SecondaryButton onClick={() => setNewModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleNewSubmit}>
              <Plus className="h-4 w-4" />登録
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DF label="受注番号" required>
              <input
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                placeholder="ORD-2026-XXXXX"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
            <DF label="SKU" required>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="TS-WH-M"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
            <DF label="商品名" required>
              <input
                value={form.product}
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                placeholder="Tシャツ ホワイト M"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
            <DF label="数量" required>
              <input
                type="number"
                min={1}
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: Math.max(1, Number(e.target.value)) }))}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
            <DF label="振替元倉庫">
              <select
                value={form.warehouse}
                onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {FROM_WAREHOUSES.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </DF>
            <DF label="振替先">
              <select
                value={form.route}
                onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {TO_ROUTES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </DF>
            <DF label="振替理由" required>
              <input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="検品不良・配送破損・色違いなど"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
            <DF label="担当者">
              <input
                value={form.registeredBy}
                onChange={(e) => setForm((f) => ({ ...f, registeredBy: e.target.value }))}
                placeholder="佐藤 健（省略可）"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </DF>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DF({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-xs text-red-500 font-semibold">必須</span>}
      </label>
      {children}
    </div>
  );
}
