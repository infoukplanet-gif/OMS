"use client";

import { useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  customerRanksStore,
  INITIAL_CUSTOMER_RANKS,
  type CustomerRanksConfig,
  type Rank,
} from "@/lib/stores/customer-ranks";
import { cn } from "@/lib/utils";
import {
  Save,
  Calculator,
  Layers,
  RefreshCw,
  Bell,
  GitMerge,
  Clock,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";

export default function PurchaseCountPage() {
  const toast = useToast();

  // 永続化オーナー（このページのみ usePersistentStore を張る）
  usePersistentStore({
    store: customerRanksStore,
    domain: "customer-ranks",
    seed: INITIAL_CUSTOMER_RANKS,
  });

  // ストア購読
  const items = useSyncExternalStore(
    customerRanksStore.subscribe,
    customerRanksStore.getState,
    customerRanksStore.getState,
  );
  const config: CustomerRanksConfig = items[0] ?? INITIAL_CUSTOMER_RANKS[0];

  // ───── 個別フィールド更新ヘルパー ─────
  function patch(diff: Partial<CustomerRanksConfig>) {
    customerRanksStore.upsert({ ...config, ...diff });
  }

  function updateRank(id: string, rankPatch: Partial<Rank>) {
    const nextRanks = config.ranks.map((r) =>
      r.id === id ? { ...r, ...rankPatch } : r,
    );
    patch({ ranks: nextRanks });
  }

  function handleSave() {
    const active = config.ranks.filter((r) => r.active).length;
    toast.show(
      `購入回数ルールを保存しました（${active}/${config.ranks.length} ランクが有効）`,
      "success",
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">購入回数・顧客ランク設定</h1>
            <HelpHint>
              購入回数のカウント基準と、回数・累計金額に応じた顧客ランクの自動付与ルールを設定します。{"\n"}
              ここでの設定は、顧客マスタの「ランク」フィールド・自動更新バッチ・マイページ表示に反映されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            キャンセル・返品の扱い、重複受注の判定、自動再計算スケジュール、ランク降格ルールなどを一括管理します。
          </p>
        </div>
        <PrimaryButton onClick={handleSave}>
          <Save className="h-4 w-4" />設定を保存
        </PrimaryButton>
      </div>

      {/* 集計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />ランク付与済み顧客
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">2,847</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Award className="h-4 w-4" />今月のランクアップ
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">82</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />リピーター率
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">
            38.4<span className="text-sm font-normal ml-1">%</span>
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4" />最終再計算
          </div>
          <p className="mt-2 text-base font-semibold text-gray-800">2026-04-25 03:00</p>
          <p className="text-xs text-gray-500">毎日深夜実行（次回 04-26 03:00）</p>
        </GlassCard>
      </div>

      {/* カウント基準 */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">カウント基準</h2>
          <HelpHint>
            「購入回数」を集計する際、どの受注をカウント対象とするかを決定します。{"\n"}
            キャンセル・返品の扱いはランク付与の公平性に直結するため、慎重に設定してください。
          </HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <RadioBlock
            label="キャンセル受注"
            hint="顧客都合・社内都合のキャンセル受注をカウントするかどうか。"
            options={[
              { value: "exclude", label: "除外する（推奨）" },
              { value: "include", label: "カウントに含める" },
            ]}
            value={config.cancelCount}
            onChange={(v) => patch({ cancelCount: v as "exclude" | "include" })}
          />
          <RadioBlock
            label="返品済み受注"
            hint="全額返品された受注をカウントするか。一部返品は常にカウントされます。"
            options={[
              { value: "exclude", label: "除外する（推奨）" },
              { value: "include", label: "カウントに含める" },
            ]}
            value={config.returnCount}
            onChange={(v) => patch({ returnCount: v as "exclude" | "include" })}
          />
          <RadioBlock
            label="保留中の受注"
            hint="ホールド中・与信NG中の未確定受注のカウント扱い。"
            options={[
              { value: "exclude", label: "除外する（推奨）" },
              { value: "include", label: "カウントに含める" },
            ]}
            value={config.holdCount}
            onChange={(v) => patch({ holdCount: v as "exclude" | "include" })}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-white/40 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              最低カウント金額
              <HelpHint side="right">この金額未満の受注はカウントしません（0なら金額制限なし）。</HelpHint>
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.minAmount}
                onChange={(e) => patch({ minAmount: Number(e.target.value) })}
                className="w-full h-9 px-3 pr-10 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">円</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              重複受注ウィンドウ
              <HelpHint side="right">同一顧客が短時間に複数受注を入れた場合の扱い。0なら常に別カウント。</HelpHint>
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.duplicateWindow}
                onChange={(e) => patch({ duplicateWindow: Number(e.target.value) })}
                className="w-full h-9 px-3 pr-10 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">分以内</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              ウィンドウ内重複の判定
              <HelpHint side="right">同一顧客の連続受注を1回として数えるか、別々に数えるか。</HelpHint>
            </label>
            <select
              value={config.duplicateMode}
              onChange={(e) => patch({ duplicateMode: e.target.value as "merge" | "count_each" })}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="merge">1回として集約（推奨）</option>
              <option value="count_each">それぞれ別件としてカウント</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 集計範囲 */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">集計対象期間</h2>
          <HelpHint>ランク判定に使用する集計期間。短い期間ほどダイナミックなランク変動になります。</HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-sm font-medium text-gray-700">期間モード</label>
            <select
              value={config.periodMode}
              onChange={(e) => patch({ periodMode: e.target.value as CustomerRanksConfig["periodMode"] })}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">通算（取引開始からすべて）</option>
              <option value="ytd">今期（年初から）</option>
              <option value="rolling12">直近12ヶ月（推奨）</option>
              <option value="rolling24">直近24ヶ月</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">基準カレンダー</label>
            <select
              value={config.calendarBase}
              onChange={(e) => patch({ calendarBase: e.target.value as "calendar" | "fiscal" })}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="calendar">暦年（1月〜12月）</option>
              <option value="fiscal">会計年度</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">期首月</label>
            <select
              value={config.fiscalStart}
              onChange={(e) => patch({ fiscalStart: e.target.value })}
              disabled={config.calendarBase === "calendar"}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>{m}月</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* ランク閾値 */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">ランク閾値</h2>
          <HelpHint>
            購入回数 OR 累計金額のいずれかが閾値を超えると、そのランクに昇格します（OR条件）。{"\n"}
            ランクは順序を保つ必要があります。閾値を逆転させた場合、保存時にエラーとなります。
          </HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ランク</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">最低購入回数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">最低累計金額</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">特典</th>
                <th className="w-24 px-4 py-3 text-center text-xs font-medium text-gray-500">有効</th>
              </tr>
            </thead>
            <tbody>
              {config.ranks.map((r) => (
                <tr key={r.id} className="border-t border-white/30">
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold", r.color)}>{r.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      value={r.minCount}
                      onChange={(e) => updateRank(r.id, { minCount: Number(e.target.value) })}
                      className="w-24 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="ml-1 text-xs text-gray-500">回</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      value={r.minAmount}
                      onChange={(e) => updateRank(r.id, { minAmount: Number(e.target.value) })}
                      className="w-32 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="ml-1 text-xs text-gray-500">円</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={r.benefits}
                      onChange={(e) => updateRank(r.id, { benefits: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg text-sm bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={(e) => updateRank(r.id, { active: e.target.checked })}
                      className="accent-blue-500 w-4 h-4"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 自動再計算・降格ルール */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">自動再計算・降格ルール</h2>
          <HelpHint>
            ランクの再計算スケジュールと、購入が途絶えた顧客のランクをどう扱うかを設定します。
          </HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Toggle
            label="自動再計算を有効化"
            checked={config.autoRecalc}
            onChange={(v) => patch({ autoRecalc: v })}
            hint="OFFの場合、ランクは手動更新のみとなります。"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">再計算スケジュール</label>
            <select
              value={config.recalcCron}
              onChange={(e) => patch({ recalcCron: e.target.value })}
              disabled={!config.autoRecalc}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            >
              <option value="hourly">毎時</option>
              <option value="daily">毎日深夜（推奨）</option>
              <option value="weekly">週次（月曜深夜）</option>
              <option value="monthly">月次（月初）</option>
              <option value="event">受注確定時イベント駆動</option>
            </select>
          </div>
          <Toggle
            label="ランク降格を有効化"
            checked={config.demoteEnabled}
            onChange={(v) => patch({ demoteEnabled: v })}
            hint="集計期間内の購入が閾値未満になった場合、自動で降格します。"
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">降格までの猶予日数</label>
            <div className="relative">
              <input
                type="number"
                value={config.demoteGrace}
                onChange={(e) => patch({ demoteGrace: Number(e.target.value) })}
                disabled={!config.demoteEnabled}
                className="w-full h-9 px-3 pr-10 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">日</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 通知設定 */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">通知ルール</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Toggle
            label="ランクアップを顧客にメール通知"
            checked={config.notifyRankUp}
            onChange={(v) => patch({ notifyRankUp: v })}
            hint="ランクアップ時に対象顧客へお祝いメールを送信します。テンプレートは通知設定から編集できます。"
          />
          <Toggle
            label="マイルストーン購入を通知"
            checked={config.notifyMilestone}
            onChange={(v) => patch({ notifyMilestone: v })}
            hint="特定回数の購入到達時に、社内とお客様へ通知します。"
          />
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              マイルストーン回数
              <HelpHint side="right">カンマ区切りで通知タイミングを指定。例: 10,30,50,100</HelpHint>
            </label>
            <input
              type="text"
              value={config.milestones}
              onChange={(e) => patch({ milestones: e.target.value })}
              disabled={!config.notifyMilestone}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>
        </div>
      </GlassCard>

      {/* 直近の再計算結果 */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">直近の再計算ハイライト</h2>
          <HelpHint>最新バッチ実行時に発生したランク変動の概要です。</HelpHint>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "対象顧客", value: "2,847", unit: "人" },
            { label: "昇格", value: "82", unit: "人", color: "text-emerald-700" },
            { label: "降格", value: "14", unit: "人", color: "text-red-700" },
            { label: "据え置き", value: "2,751", unit: "人" },
            { label: "実行時間", value: "42", unit: "秒" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-white/50">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={cn("text-2xl font-bold tabular-nums", s.color ?? "text-gray-800")}>
                {s.value}
                <span className="text-sm font-normal ml-1">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
      <span className="flex items-center gap-1.5">
        {label}
        {hint && <HelpHint side="right">{hint}</HelpHint>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-blue-500 w-4 h-4"
      />
    </label>
  );
}

function RadioBlock({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {label}
        {hint && <HelpHint side="right">{hint}</HelpHint>}
      </label>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all",
              value === o.value
                ? "bg-blue-500/10 border border-blue-300/50 text-blue-700"
                : "bg-white/50 border border-white/50 text-gray-700 hover:bg-white/70",
            )}
          >
            <input
              type="radio"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-blue-500"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
