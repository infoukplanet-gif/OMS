"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { mailQueue, type MailJob } from "@/lib/mail/queue";
import { getAutoMailEnabled } from "@/lib/mail/auto-settings";
import { shipmentStore, type ShipmentRecord } from "@/lib/stores/shipment";
import { INITIAL_SHIPMENTS } from "@/lib/seeds/shipments";
import { Upload, Search, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * 配送番号反映ページ。
 *
 * shared shipmentStore に subscribe し、出荷済み（追跡番号反映待ち）と 配送中（通知済み）を
 * 一覧表示する。追跡番号を入力して「反映」すると shipmentStore.applyTransition(markInTransit)
 * を起動し、shipment-handlers が emit する sendMail（delivery-notify）を mailQueue へ enqueue。
 *
 * 反映＝配送中遷移＋追跡番号書き込み＋配送通知メールが連鎖で発火する。
 */

const carriers = ["すべて", "ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"] as const;

type Pending = ShipmentRecord & {
  customer?: string;
  carrier?: string;
  shipDate?: string;
  shop?: string;
};

export default function ShipmentsTrackingPage() {
  const toast = useToast();

  // 共有 shipmentStore を購読。初回マウントで empty なら INITIAL_SHIPMENTS を seed。
  useEffect(() => {
    if (shipmentStore.getState().length === 0) {
      shipmentStore.setItems(INITIAL_SHIPMENTS);
    }
  }, []);
  const items = useSyncExternalStore(
    (cb) => shipmentStore.subscribe(cb),
    () => shipmentStore.getState(),
    () => INITIAL_SHIPMENTS as readonly ShipmentRecord[],
  );

  // 配送番号反映の対象は 出荷済み（未反映）と 配送中（反映済み）の2グループ。
  // フィルタ＋表示用に共有データから派生させる。
  const targets = useMemo(
    () =>
      items.filter(
        (s) => s.status === "出荷済み" || s.status === "配送中",
      ) as readonly Pending[],
    [items],
  );

  // 入力中の追跡番号（コミット前のローカル状態）。
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // 反映済み（配送中）の trackingNumber は store の値を表示するため、出荷済みのみ draft 対象。
  const draftFor = (id: string, fallback?: string) => drafts[id] ?? fallback ?? "";

  const [keyword, setKeyword] = useState("");
  const [carrier, setCarrier] = useState<(typeof carriers)[number]>("すべて");
  const [pendingOnly, setPendingOnly] = useState(true);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return targets.filter((s) => {
      if (k && !s.id.toLowerCase().includes(k) && !(s.customer ?? "").toLowerCase().includes(k)) return false;
      if (carrier !== "すべて" && s.carrier !== carrier) return false;
      if (pendingOnly && s.status !== "出荷済み") return false;
      return true;
    });
  }, [targets, keyword, carrier, pendingOnly]);

  const stats = useMemo(() => ({
    total: targets.length,
    pendingInput: targets.filter((s) => s.status === "出荷済み" && !s.trackingNumber).length,
    readyToApply: targets.filter(
      (s) => s.status === "出荷済み" && ((drafts[s.id] ?? s.trackingNumber ?? "").trim().length > 0),
    ).length,
    notified: targets.filter((s) => s.status === "配送中").length,
  }), [targets, drafts]);

  const setDraft = (id: string, value: string) => setDrafts((d) => ({ ...d, [id]: value }));

  /**
   * 1件反映: markInTransit で 出荷済み → 配送中 へ遷移。
   * trackingNumber を SM 経由で書き込み、sendMail (delivery-notify) を mailQueue へ enqueue する。
   */
  const apply = (s: Pending) => {
    const tracking = draftFor(s.id, s.trackingNumber).trim();
    if (!tracking) {
      toast.show("追跡番号を入力してください", "error");
      return;
    }
    const result = shipmentStore.applyTransition(s.id, "markInTransit", { trackingNumber: tracking });
    if (!result.applied) {
      toast.show(`${s.id} は 出荷済み 状態ではないため反映できません`, "error");
      return;
    }
    const jobs: MailJob[] = result.effects.sendMail ? [result.effects.sendMail] : [];
    const mail = mailQueue.enqueueAll(jobs, getAutoMailEnabled());
    const tail = mail.enqueued > 0 ? ` / 配送通知メール ${mail.enqueued}件enqueue` : "";
    toast.show(`${s.id} に追跡番号 ${tracking} を反映しました${tail}`, "success");
    setDrafts((d) => {
      const next = { ...d };
      delete next[s.id];
      return next;
    });
  };

  /** 一括反映: filtered のうち追跡番号が入力済みの 出荷済み 全件に markInTransit を流す。 */
  const applyAll = () => {
    const targets = filtered.filter((s) => s.status === "出荷済み" && draftFor(s.id, s.trackingNumber).trim().length > 0);
    if (targets.length === 0) {
      toast.show("反映対象がありません（追跡番号を入力してください）", "info");
      return;
    }
    let succeeded = 0;
    const jobs: MailJob[] = [];
    const consumedIds: string[] = [];
    for (const s of targets) {
      const tracking = draftFor(s.id, s.trackingNumber).trim();
      const r = shipmentStore.applyTransition(s.id, "markInTransit", { trackingNumber: tracking });
      if (!r.applied) continue;
      if (r.effects.sendMail) jobs.push(r.effects.sendMail);
      succeeded += 1;
      consumedIds.push(s.id);
    }
    if (succeeded === 0) {
      toast.show("反映可能な出荷がありません", "error");
      return;
    }
    const mail = mailQueue.enqueueAll(jobs, getAutoMailEnabled());
    const tail = mail.enqueued > 0 ? ` / 配送通知メール ${mail.enqueued}件enqueue` : "";
    toast.show(`${succeeded} 件の追跡番号を反映しました${tail}`, "success");
    setDrafts((d) => {
      const next = { ...d };
      for (const id of consumedIds) delete next[id];
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">配送番号反映</h1>
            <HelpHint>
              出荷済み伝票に配送業者から取得した追跡番号を反映し、配送通知メールを送信します。{"\n"}
              反映＝配送中遷移＋追跡番号書き込み＋配送通知メールが連鎖します。CSV取込にも対応。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            未反映: <span className="font-semibold text-amber-700">{stats.pendingInput}件</span> ／ 反映待ち:{" "}
            <span className="font-semibold text-blue-700">{stats.readyToApply}件</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.show("CSV取込モーダルを開きました")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
          >
            <Upload className="h-4 w-4" />CSV一括登録
          </button>
          <PrimaryButton onClick={applyAll}>
            <CheckCircle2 className="h-4 w-4" />一括反映
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4"><p className="text-sm text-gray-500">対象受注</p><p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{stats.total}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">追跡番号未取得</p><p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{stats.pendingInput}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">反映待ち</p><p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{stats.readyToApply}</p></GlassCard>
        <GlassCard className="p-4"><p className="text-sm text-gray-500">反映済み（配送中）</p><p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{stats.notified}</p></GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">配送業者</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as (typeof carriers)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {carriers.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            未反映のみ表示
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">配送業者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">出荷予定日</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">追跡番号</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">通知</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">対象受注がありません。</td>
              </tr>
            ) : (
              filtered.map((s) => {
                const notified = s.status === "配送中";
                const value = draftFor(s.id, s.trackingNumber);
                const ready = !notified && value.trim().length > 0;
                return (
                  <tr key={s.id} className={cn("border-t border-white/30 hover:bg-white/40", notified && "opacity-70")}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/orders/${s.id}/edit`} className="text-blue-700 hover:underline">
                        {s.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{s.customer ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{s.carrier ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{s.shipDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      <input
                        value={value}
                        onChange={(e) => setDraft(s.id, e.target.value)}
                        disabled={notified}
                        placeholder="追跡番号を入力..."
                        className={cn(
                          "w-full h-7 px-2 rounded-lg text-xs font-mono bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20",
                          notified && "bg-white/30 text-gray-500",
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {notified ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />通知済
                        </span>
                      ) : ready ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-700">
                          <RefreshCw className="h-3 w-3" />反映待ち
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                          <AlertTriangle className="h-3 w-3" />未取得
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => apply(s)}
                        disabled={!ready}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium",
                          ready
                            ? "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                            : "bg-gray-200/40 text-gray-400 cursor-not-allowed",
                        )}
                      >
                        反映
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
