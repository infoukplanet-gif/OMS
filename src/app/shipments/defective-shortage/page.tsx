"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton, SecondaryButton, Modal } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  Search,
  AlertTriangle,
  RefreshCw,
  Mail,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { defectiveStore } from "@/lib/stores/defective";
import { INITIAL_DEFECTIVE } from "@/lib/seeds/defective";
import type { DefectiveRecord } from "@/lib/state-machines/defective";
import { defectiveLotStore } from "@/lib/stores/defective-lot";
import { INITIAL_DEFECTIVE_LOTS } from "@/lib/seeds/defective-lot";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  transitionLotDefect,
  type LotDefectRecord,
  type LotDefectAction,
  type LotRootCause,
  type LotResponsibility,
  type LotDefectStatus,
} from "@/lib/state-machines/defective-lot";

type RootCause = LotRootCause;
type Responsibility = LotResponsibility;
type LotStatus = LotDefectStatus;
type LotDefectRow = LotDefectRecord;

const ROOT_CAUSES: RootCause[] = ["メーカー由来", "輸送中破損", "倉庫保管不良", "原因調査中"];
const RESPONSIBILITIES: Responsibility[] = ["メーカー", "配送業者", "自社", "未確定"];
const WAREHOUSES = ["東京本社倉庫", "大阪倉庫", "九州物流センター", "名古屋配送センター"];

const STATUS_BADGE: Record<LotStatus, string> = {
  "未対応": "bg-red-500/15 text-red-700",
  "メーカー連絡済": "bg-blue-500/15 text-blue-700",
  "代替手配中": "bg-amber-500/15 text-amber-700",
  "全件対応完了": "bg-emerald-500/15 text-emerald-700",
  "終結": "bg-gray-500/15 text-gray-600",
};

const RESP_BADGE: Record<Responsibility, string> = {
  "メーカー": "bg-purple-500/15 text-purple-700",
  "配送業者": "bg-orange-500/15 text-orange-700",
  "自社": "bg-red-500/15 text-red-700",
  "未確定": "bg-gray-500/15 text-gray-600",
};

const BLANK_FORM = {
  lot: "",
  sku: "",
  product: "",
  warehouse: "東京本社倉庫",
  detected: 1,
  affected: 0,
  rootCause: "原因調査中" as RootCause,
  responsibility: "未確定" as Responsibility,
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

/** 既存ID群の最大連番+1で次のIDを採番する（行削除・他画面登録があっても衝突しない） */
function nextId(prefix: string, ids: readonly string[]): string {
  const max = ids.reduce((m, id) => {
    const n = Number(id.replace(`${prefix}-`, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/** ロット不良 → 不良品振替台帳レコードへの写像。責任がメーカーならメーカー返却に振り替える。 */
function toLedgerRecord(row: LotDefectRow, id: string): DefectiveRecord {
  return {
    id,
    order: "—",
    product: row.product,
    sku: row.sku,
    warehouse: row.warehouse,
    qty: row.detected,
    reason: `ロット不良（${row.rootCause}）/ ${row.lot}`,
    route: row.responsibility === "メーカー" ? "メーカー返却" : "返品倉庫",
    source: "manual",
    registeredAt: nowString(),
    registeredBy: "不良欠品処理",
    status: "承認待ち",
  };
}

export default function ShipmentsDefectiveShortagePage() {
  const toast = useToast();

  // 正規オーナーは shipments/defective（usePersistentStore はそちらで1回だけ）。
  // ここは非オーナー購読者として防御的シードのみ行う。
  useEffect(() => {
    if (defectiveStore.getState().length === 0) {
      defectiveStore.setItems(INITIAL_DEFECTIVE);
    }
  }, []);

  const ledger = useSyncExternalStore(
    (cb) => defectiveStore.subscribe(cb),
    () => defectiveStore.getState(),
    () => INITIAL_DEFECTIVE,
  );

  // ロット不良行（domain "shipment-defective-lots"）の正規オーナー。
  // ここで snapshot/restore を1回だけ駆動し、リロード後も対応状況を復元する。
  usePersistentStore({
    store: defectiveLotStore,
    domain: "shipment-defective-lots",
    seed: INITIAL_DEFECTIVE_LOTS,
  });

  const rows = useSyncExternalStore(
    (cb) => defectiveLotStore.subscribe(cb),
    () => defectiveLotStore.getState(),
    () => INITIAL_DEFECTIVE_LOTS,
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("未終結のみ");
  const [respFilter, setRespFilter] = useState("すべて");
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows
      .filter((r) => {
        if (k && !r.lot.toLowerCase().includes(k) && !r.sku.toLowerCase().includes(k) && !r.product.toLowerCase().includes(k)) return false;
        if (statusFilter === "未終結のみ" && r.status === "終結") return false;
        if (statusFilter !== "未終結のみ" && statusFilter !== "すべて" && r.status !== statusFilter) return false;
        if (respFilter !== "すべて" && r.responsibility !== respFilter) return false;
        return true;
      })
      // ストアは upsert で末尾追加なので、新着が上に来るよう報告日時の降順で表示する
      // （"YYYY-MM-DD HH:mm" は辞書順=時系列順）。
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  }, [rows, keyword, statusFilter, respFilter]);

  const stats = useMemo(() => ({
    open: rows.filter((r) => r.status !== "終結" && r.status !== "全件対応完了").length,
    detected: rows.reduce((s, r) => s + r.detected, 0),
    affected: rows.reduce((s, r) => s + r.affected, 0),
    linked: rows.filter((r) => r.ledgerId && ledger.some((d) => d.id === r.ledgerId)).length,
  }), [rows, ledger]);

  // 状態遷移は必ず state-machine transitionLotDefect を経由する（status の直書き禁止）。
  // 不正遷移は no-op（同一参照）になるので、その場合はエラーtoastで弾く。
  const updateStatus = (id: string, action: LotDefectAction, message: string) => {
    const current = defectiveLotStore.findById(id);
    if (!current) return;
    const next = transitionLotDefect(current, action);
    if (next === current) {
      toast.show("この操作はできません", "error");
      return;
    }
    defectiveLotStore.upsert(next);
    toast.show(message, "success");
  };

  /** 検出不良数を不良品振替台帳へ承認待ちとして登録する（既登録なら冪等にスキップ）。 */
  const registerToLedger = (row: LotDefectRow) => {
    if (row.ledgerId && ledger.some((d) => d.id === row.ledgerId)) {
      toast.show(`${row.id} は台帳登録済みです（${row.ledgerId}）`, "info");
      return;
    }
    const id = nextId("DF", ledger.map((d) => d.id));
    const res = defectiveStore.register(toLedgerRecord(row, id));
    if (!res.applied) {
      toast.show(`台帳登録に失敗しました（${id} はID重複）`, "error");
      return;
    }
    defectiveLotStore.upsert({ ...row, ledgerId: id });
    toast.show(`${row.id} の不良 ${row.detected}点 を振替台帳 ${id} に登録しました（承認待ち）`, "success");
  };

  function handleNewSubmit() {
    if (!form.lot.trim()) { toast.show("ロット番号を入力してください", "error"); return; }
    if (!form.sku.trim()) { toast.show("SKUを入力してください", "error"); return; }
    if (!form.product.trim()) { toast.show("商品名を入力してください", "error"); return; }
    if (form.detected < 1) { toast.show("検出不良数は1以上を入力してください", "error"); return; }
    const newRow: LotDefectRow = {
      id: nextId("DS", rows.map((r) => r.id)),
      lot: form.lot.trim(),
      sku: form.sku.trim(),
      product: form.product.trim(),
      warehouse: form.warehouse,
      detected: form.detected,
      affected: Math.max(0, form.affected),
      rootCause: form.rootCause,
      reportedAt: nowString(),
      status: "未対応",
      responsibility: form.responsibility,
    };
    const ledgerId = nextId("DF", ledger.map((d) => d.id));
    const res = defectiveStore.register(toLedgerRecord(newRow, ledgerId));
    defectiveLotStore.upsert({ ...newRow, ledgerId: res.applied ? ledgerId : undefined });
    toast.show(
      res.applied
        ? `${newRow.id} を登録し、振替台帳 ${ledgerId} を起票しました（承認待ち）`
        : `${newRow.id} を登録しました（台帳起票はID重複でスキップ）`,
      res.applied ? "success" : "info",
    );
    setNewModalOpen(false);
    setForm(BLANK_FORM);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">不良欠品処理</h1>
            <HelpHint>
              入荷ロット単位で発覚した不良（メーカー由来・輸送破損など）の対応状況を管理します。{"\n"}
              検出した不良数は「台帳登録」で不良品振替台帳に起票され、承認 → 振替実行で良品在庫から減算されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未対応・進行中: <span className="font-semibold text-amber-700">{stats.open}件</span> ／ 台帳連携済み:{" "}
            <span className="font-semibold text-blue-700">{stats.linked}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => { setForm(BLANK_FORM); setNewModalOpen(true); }}>
          <Plus className="h-4 w-4" />新規ロット不良登録
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">未対応・進行中</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.open}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">検出不良数</p><p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{stats.detected}<span className="text-sm font-normal ml-1">点</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">影響受注数</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.affected}<span className="text-sm font-normal ml-1">件</span></p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">台帳連携済み</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.linked}<span className="text-sm font-normal ml-1">件</span></p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ロット番号・SKU・商品名"
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
              {["未終結のみ", "すべて", "未対応", "メーカー連絡済", "代替手配中", "全件対応完了", "終結"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">責任区分</label>
            <select
              value={respFilter}
              onChange={(e) => setRespFilter(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", ...RESPONSIBILITIES].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ロット</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">不良/影響</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">原因</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">責任</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">台帳</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500">
                  条件に一致するロット不良はありません
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const ledgerRecord = r.ledgerId ? ledger.find((d) => d.id === r.ledgerId) : undefined;
              return (
                <tr key={r.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{r.id}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.lot}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800">{r.product}</p>
                    <p className="text-[10px] font-mono text-gray-500">{r.sku} ／ {r.warehouse}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                    <span className="text-red-600 font-bold">{r.detected}</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-gray-700">{r.affected}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.rootCause}</td>
                  <td className="px-3 py-2.5 text-xs">
                    <span className={cn("px-2 py-0.5 rounded-md font-medium", RESP_BADGE[r.responsibility])}>{r.responsibility}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {ledgerRecord ? (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 font-mono text-[10px] whitespace-nowrap">
                        {ledgerRecord.id}（{ledgerRecord.status}）
                      </span>
                    ) : (
                      <span className="text-gray-400">未登録</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", STATUS_BADGE[r.status])}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {r.status === "未対応" && (
                        <>
                          <button
                            onClick={() => updateStatus(r.id, "contactMaker", `${r.id} をメーカー連絡済にしました`)}
                            title="メーカー連絡済にする"
                            className="inline-flex p-1.5 rounded-lg bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => updateStatus(r.id, "arrangeAlt", `${r.id} の代替品手配を開始しました`)}
                            title="代替手配を開始する"
                            className="inline-flex p-1.5 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {(r.status === "メーカー連絡済" || r.status === "代替手配中") && (
                        <button
                          onClick={() => updateStatus(r.id, "complete", `${r.id} を全件対応完了にしました`)}
                          title="全件対応完了にする"
                          className="inline-flex p-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "全件対応完了" && (
                        <button
                          onClick={() => updateStatus(r.id, "close", `${r.id} を終結しました`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-600 hover:bg-gray-500/25"
                        >
                          終結
                        </button>
                      )}
                      {r.status !== "終結" && (
                        <button
                          onClick={() => registerToLedger(r)}
                          title={ledgerRecord ? "不良品振替台帳に登録済み" : "検出不良数を不良品振替台帳に登録する"}
                          className={cn(
                            "inline-flex p-1.5 rounded-lg",
                            ledgerRecord
                              ? "bg-gray-500/10 text-gray-400 cursor-default"
                              : "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25",
                          )}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status === "終結" && <CheckCircle2 className="h-4 w-4 text-gray-400" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold text-gray-800">不良品振替台帳との連携</h2>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "「台帳登録」で検出不良数を不良品振替台帳に承認待ちとして起票",
            "責任区分がメーカーの場合は振替先がメーカー返却、それ以外は返品倉庫",
            "承認・振替実行は不良品振替ページで行い、実行時に良品在庫を減算",
            "登録済みロットの再登録は抑止（台帳列に登録先IDと現在の状態を表示）",
            "新規ロット不良登録時は台帳起票まで自動で実行",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>

      <Modal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="新規ロット不良登録"
        footer={
          <>
            <SecondaryButton onClick={() => setNewModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleNewSubmit}>
              <Plus className="h-4 w-4" />登録
            </PrimaryButton>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="ロット番号" required>
            <input
              value={form.lot}
              onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))}
              placeholder="LOT-2026-04-XX-A"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="SKU" required>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="WEP-001-BK"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="商品名" required>
            <input
              value={form.product}
              onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              placeholder="ワイヤレスイヤホン Pro ブラック"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="保管倉庫">
            <select
              value={form.warehouse}
              onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="検出不良数" required>
            <input
              type="number"
              min={1}
              value={form.detected}
              onChange={(e) => setForm((f) => ({ ...f, detected: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="影響受注数">
            <input
              type="number"
              min={0}
              value={form.affected}
              onChange={(e) => setForm((f) => ({ ...f, affected: Math.max(0, Number(e.target.value) || 0) }))}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="原因区分">
            <select
              value={form.rootCause}
              onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value as RootCause }))}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {ROOT_CAUSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="責任区分">
            <select
              value={form.responsibility}
              onChange={(e) => setForm((f) => ({ ...f, responsibility: e.target.value as Responsibility }))}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {RESPONSIBILITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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
