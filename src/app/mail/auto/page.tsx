"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  getAutoMailEnabled,
  setAutoMailEnabled,
  resetAutoMailEnabled,
} from "@/lib/mail/auto-settings";
import type { MailTriggerType } from "@/lib/mail/queue";

type Trigger = {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  template: string;
  delay: string;
  retryMax: number;
  cc?: string;
  bcc?: string;
  /** v1 mail queue にマップされるトリガー種別（未設定なら queue とは無関係。v2 で実装予定） */
  queueTrigger?: MailTriggerType;
};

const initial: Trigger[] = [
  { id: "thanks", queueTrigger: "thanks", name: "受注確認（サンクスメール）", desc: "受注ステータスが「受付完了」になった直後に自動送信", enabled: true, template: "サンクスメール（自動）", delay: "受注確認後 即時", retryMax: 3, bcc: "log@example.com" },
  { id: "ship", queueTrigger: "ship-notify", name: "出荷完了通知", desc: "出荷ステータスが「出荷済」になった直後に自動送信", enabled: true, template: "出荷通知メール（自動）", delay: "出荷登録後 即時", retryMax: 3 },
  { id: "payment-confirmed", queueTrigger: "payment-confirmed", name: "入金確認メール", desc: "入金が確認できた直後に「ご入金ありがとうございます」を送信", enabled: true, template: "入金確認メール（自動）", delay: "入金記録後 即時", retryMax: 3 },
  { id: "payment3", name: "入金催促（3日経過）", desc: "代引き／銀振の入金待ちが3日経過した受注へ自動送信", enabled: true, template: "入金確認メール（自動）", delay: "入金待ち3日後 09:00", retryMax: 2 },
  { id: "payment7", name: "入金催促（7日経過・最終通告）", desc: "入金待ちが7日経過した受注へ送信。送信後は要オペレーター確認", enabled: false, template: "入金催促（最終通告）", delay: "入金待ち7日後 09:00", retryMax: 2, cc: "ops@example.com" },
  { id: "follow", name: "フォローアップ（発送後3日）", desc: "商品到着確認・レビュー誘導のフォローメール", enabled: true, template: "フォローアップメール", delay: "発送後3日後 10:00", retryMax: 1 },
  { id: "stockout", name: "在庫切れ連絡", desc: "受注に対し在庫不足が発生した場合に送信", enabled: false, template: "在庫切れご連絡", delay: "在庫不足検知後 即時", retryMax: 2 },
  { id: "reship", name: "再発送のお知らせ", desc: "返送・配送ミス対応で再発送した際に送信", enabled: true, template: "再発送のお知らせ", delay: "再発送登録後 即時", retryMax: 2 },
  { id: "review", name: "レビュー依頼（発送後7日）", desc: "発送から7日後にレビュー依頼メールを送信", enabled: false, template: "レビュー依頼", delay: "発送後7日後 19:00", retryMax: 1 },
];

const templateOptions = [
  "サンクスメール（自動）",
  "出荷通知メール（自動）",
  "入金確認メール（自動）",
  "入金催促（最終通告）",
  "フォローアップメール",
  "在庫切れご連絡",
  "再発送のお知らせ",
  "レビュー依頼",
];

/** queueTrigger を持つ初期アイテムの enabled を auto-settings に同期。マウント時に1回呼ぶ。 */
function syncQueueEnabledFromItems(items: Trigger[]) {
  const patch: Partial<Record<MailTriggerType, boolean>> = {};
  for (const item of items) {
    if (item.queueTrigger) patch[item.queueTrigger] = item.enabled;
  }
  setAutoMailEnabled(patch);
}

export default function MailAutoPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);

  // ページ表示時にローカル state を auto-settings の現在値で復元しておく
  // （他ページからの遷移で settings が書き換わっていてもズレないように）
  useEffect(() => {
    const enabled = getAutoMailEnabled();
    setItems((prev) =>
      prev.map((it) =>
        it.queueTrigger ? { ...it, enabled: enabled[it.queueTrigger] } : it,
      ),
    );
  }, []);

  const updateItem = (id: string, patch: Partial<Trigger>) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, ...patch };
        // queueTrigger を持つトリガーの enabled 変化は即 auto-settings に書く
        if (next.queueTrigger && patch.enabled !== undefined) {
          setAutoMailEnabled({ [next.queueTrigger]: patch.enabled });
        }
        return next;
      }),
    );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">自動送信設定</h1>
            <HelpHint>受注フローに連動するメール自動送信トリガーの一覧。各トリガーごとにテンプレート・送信タイミング・リトライ回数を個別設定できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">受注確認・出荷通知・入金催促などのトリガーを管理します。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton
            onClick={() => {
              setItems(initial);
              resetAutoMailEnabled();
              toast.show("初期値に戻しました（v1 トリガーは全 ON）", "info");
            }}
          >
            初期値に戻す
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              syncQueueEnabledFromItems(items);
              toast.show("自動送信設定を保存しました（v1 トリガーは即時反映）", "success");
            }}
          >
            保存
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録トリガー</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">有効トリガー</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">無効トリガー</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{items.filter((i) => !i.enabled).length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">最大リトライ平均</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {(items.reduce((s, i) => s + i.retryMax, 0) / items.length).toFixed(1)}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          グローバル設定 <HelpHint>全自動送信トリガーに共通して適用される動作設定。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">送信開始時刻（営業時間）</span>
            <input type="time" defaultValue="09:00" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">送信終了時刻</span>
            <input type="time" defaultValue="20:00" className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-gray-500">時間外キューの扱い</span>
            <select className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option>翌営業日の開始時刻に送信</option>
              <option>そのまま即時送信</option>
              <option>キューに保留</option>
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-sm font-semibold text-gray-800">
          トリガー詳細設定
        </div>
        <div className="divide-y divide-white/40">
          {items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{item.name}</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        item.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/15 text-gray-500"
                      )}
                    >
                      {item.enabled ? "有効" : "無効"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">テンプレート</span>
                  <select
                    value={item.template}
                    onChange={(e) => updateItem(item.id, { template: e.target.value })}
                    disabled={!item.enabled}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 disabled:opacity-50"
                  >
                    {templateOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">送信タイミング</span>
                  <input
                    type="text"
                    value={item.delay}
                    onChange={(e) => updateItem(item.id, { delay: e.target.value })}
                    disabled={!item.enabled}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 disabled:opacity-50"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">最大リトライ回数</span>
                  <input
                    type="number"
                    value={item.retryMax}
                    onChange={(e) => updateItem(item.id, { retryMax: Number(e.target.value) })}
                    disabled={!item.enabled}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 disabled:opacity-50"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">CC / BCC</span>
                  <input
                    type="text"
                    placeholder="例: ops@example.com"
                    defaultValue={item.cc || item.bcc || ""}
                    disabled={!item.enabled}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 disabled:opacity-50"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
