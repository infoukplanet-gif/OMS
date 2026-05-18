"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { AlertCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/interactive";
import {
  setAutoMailEnabled,
  resetAutoMailEnabled,
} from "@/lib/mail/auto-settings";

type AutomationKey =
  | "allocate"
  | "mail-compose"
  | "mail-send"
  | "inventory-sync"
  | "product-autocreate"
  | "np-connect"
  | "order-fetch"
  | "customer-autocreate";

interface Automation {
  key: AutomationKey;
  name: string;
  desc: string;
  enabled: boolean;
  lastRun: string;
  warning?: boolean;
}

const INITIAL: Automation[] = [
  {
    key: "allocate",
    name: "引当処理",
    desc: "商品マスタのフリー在庫から、引当待ちステータスの受注伝票に商品の引当を開始します。",
    enabled: true,
    lastRun: "2026/04/13 18:55",
  },
  {
    key: "mail-compose",
    name: "メール設定処理（受注確認・印刷日待ち・印刷待ち以降・発送・フォロー）",
    desc: "各ステータスの受注に対し、設定済みテンプレートでメールを作成しキューに蓄積します。OFF にすると mail/auto の v1 全トリガーも停止します。",
    enabled: true,
    lastRun: "2026/04/13 18:50",
  },
  {
    key: "mail-send",
    name: "メール送信処理",
    desc: "メールキューに蓄積されたメールの送信を開始します。",
    enabled: true,
    lastRun: "2026/04/13 18:45",
  },
  {
    key: "inventory-sync",
    name: "在庫更新処理",
    desc: "各モール・カート側の在庫数を、本システムのフリー在庫数で上書きします。",
    enabled: true,
    lastRun: "2026/04/13 18:40",
  },
  {
    key: "product-autocreate",
    name: "商品情報自動作成",
    desc: "受注取込時、受注した商品情報の自動作成を開始します。在庫管理を行う場合は利用を控えてください（商品コードと在庫数:10億個で登録されます）。",
    enabled: false,
    lastRun: "—",
    warning: true,
  },
  {
    key: "np-connect",
    name: "NPコネクトAPI処理",
    desc: "事前にツール>決済>NPコネクトPROサポート画面にて必要な情報を登録している場合、NPコネクトPROとの自動連携を開始します。",
    enabled: false,
    lastRun: "—",
  },
  {
    key: "order-fetch",
    name: "受注取得API処理",
    desc: "基本情報>API設定画面にて受注API設定済みのモール・カートから、自動での受注データ取得を開始します。",
    enabled: true,
    lastRun: "2026/04/13 18:55",
  },
  {
    key: "customer-autocreate",
    name: "顧客マスタ自動作成",
    desc: "新規受注取込時に顧客マスタを自動作成します。",
    enabled: false,
    lastRun: "—",
  },
];

/**
 * mail-compose トグルが OFF/ON した時に mail/auto の v1 全トリガーをまとめて反映する。
 * OFF: handler.sendMail 由来の enqueue が全部 disabledSkipped になる
 * ON : DEFAULT（全有効）に戻す
 */
function syncMailComposeToAutoSettings(enabled: boolean): void {
  if (enabled) {
    resetAutoMailEnabled();
  } else {
    setAutoMailEnabled({
      thanks: false,
      "ship-notify": false,
      "payment-confirmed": false,
    });
  }
}

export default function AutomationPage() {
  const toast = useToast();
  const [items, setItems] = useState<Automation[]>(INITIAL);

  const setEnabled = (key: AutomationKey, enabled: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, enabled } : it)),
    );
    if (key === "mail-compose") {
      syncMailComposeToAutoSettings(enabled);
      toast.show(
        enabled
          ? "メール設定処理を起動しました（v1 自動トリガーを全有効に戻しました）"
          : "メール設定処理を停止しました（mail/auto の v1 トリガーも一括 OFF）",
        enabled ? "success" : "info",
      );
      return;
    }
    toast.show(
      `${INITIAL.find((i) => i.key === key)?.name ?? key} を${enabled ? "起動" : "停止"}しました`,
      enabled ? "success" : "info",
    );
  };

  const persistAll = () => {
    // v1 はモジュール状態のみ。永続化は v2 で server action + DB に置き換え。
    toast.show("自動実行処理設定を保存しました（モジュール内 state）", "success");
  };

  const activeCount = items.filter((i) => i.enabled).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">自動実行処理設定</h1>
        <p className="text-sm text-gray-500 mt-1">バックグラウンドで動作している処理の起動・停止設定を行います。</p>
      </div>

      <GlassCard className="bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
          <div className="text-sm text-yellow-800 space-y-1">
            <p>システムに取り込まれている過去の受注は、メール送信処理の対象となる可能性があります。</p>
            <p>メール送信処理を初めて使われる場合は、必ずマニュアルをご確認ください。</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録ジョブ</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">起動中</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">停止中</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{items.length - activeCount}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">メール処理</div>
          <div className={cn(
            "text-2xl font-bold mt-1",
            items.find((i) => i.key === "mail-compose")?.enabled ? "text-emerald-600" : "text-gray-400",
          )}>
            {items.find((i) => i.key === "mail-compose")?.enabled ? "起動" : "停止"}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30">
          <h2 className="text-sm font-semibold text-gray-700">自動実行処理一覧</h2>
        </div>
        <div className="divide-y divide-white/30">
          {items.map((a) => (
            <div key={a.key} className="flex items-start justify-between gap-4 p-4 hover:bg-white/40 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{a.name}</p>
                  <button className="text-gray-400 hover:text-blue-500 transition-colors">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                  {a.warning && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/15 text-yellow-700 font-medium">注意</span>}
                  {a.key === "mail-compose" && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-700 font-medium">v1 mail-trigger 連動</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{a.desc}</p>
                <p className="text-[10px] text-gray-400 mt-1">最終実行: {a.lastRun}</p>
              </div>
              <div className="shrink-0">
                <select
                  value={a.enabled ? "起動" : "停止"}
                  onChange={(e) => setEnabled(a.key, e.target.value === "起動")}
                  className={cn(
                    "h-9 px-3 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                    a.enabled
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                      : "bg-gray-500/15 text-gray-600 border-gray-500/30"
                  )}
                >
                  <option value="起動">起動</option>
                  <option value="停止">停止</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-white/40 bg-white/30 flex justify-end">
          <button
            onClick={persistAll}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            自動実行処理を変更
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
