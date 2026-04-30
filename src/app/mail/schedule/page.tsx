"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { Calendar, Plus, Trash2 } from "lucide-react";

const dows = ["月", "火", "水", "木", "金", "土", "日"];

type ScheduleRule = {
  id: string;
  trigger: string;
  windowStart: string;
  windowEnd: string;
  daysOfWeek: number[];
  blackoutMessage: string;
  outsideAction: "next-business-day" | "send-immediately" | "hold";
  enabled: boolean;
};

const initialSchedule: ScheduleRule[] = [
  { id: "rule-thanks", trigger: "受注確認", windowStart: "08:00", windowEnd: "21:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], blackoutMessage: "通常通り送信", outsideAction: "send-immediately", enabled: true },
  { id: "rule-ship", trigger: "出荷通知", windowStart: "09:00", windowEnd: "20:00", daysOfWeek: [0, 1, 2, 3, 4, 5], blackoutMessage: "翌営業日朝", outsideAction: "next-business-day", enabled: true },
  { id: "rule-payment", trigger: "入金催促", windowStart: "10:00", windowEnd: "18:00", daysOfWeek: [0, 1, 2, 3, 4], blackoutMessage: "翌営業日朝", outsideAction: "next-business-day", enabled: true },
  { id: "rule-follow", trigger: "フォローアップ", windowStart: "11:00", windowEnd: "19:00", daysOfWeek: [1, 2, 3, 4, 5], blackoutMessage: "保留", outsideAction: "hold", enabled: true },
  { id: "rule-review", trigger: "レビュー依頼", windowStart: "18:00", windowEnd: "21:00", daysOfWeek: [4, 5, 6], blackoutMessage: "保留", outsideAction: "hold", enabled: false },
];

const holidays = [
  { date: "2026/05/03", name: "憲法記念日" },
  { date: "2026/05/04", name: "みどりの日" },
  { date: "2026/05/05", name: "こどもの日" },
  { date: "2026/07/20", name: "海の日" },
  { date: "2026/08/11", name: "山の日" },
  { date: "2026/09/21", name: "敬老の日" },
];

export default function MailSchedulePage() {
  const toast = useToast();
  const [rules, setRules] = useState(initialSchedule);
  const [defaultStart, setDefaultStart] = useState("09:00");
  const [defaultEnd, setDefaultEnd] = useState("20:00");
  const [holidayMode, setHolidayMode] = useState("skip");

  const updateRule = (id: string, patch: Partial<ScheduleRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const toggleDow = (id: string, idx: number) => {
    const r = rules.find((x) => x.id === id);
    if (!r) return;
    const next = r.daysOfWeek.includes(idx) ? r.daysOfWeek.filter((d) => d !== idx) : [...r.daysOfWeek, idx];
    updateRule(id, { daysOfWeek: next });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">送信時間設定</h1>
            <HelpHint>メール送信が許可される時間帯と曜日を設定します。深夜や土日に届かないように制御できます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">送信ウィンドウ・休業日・時間外キューの扱いを制御し、顧客体験を保ちます。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => setRules(initialSchedule)}>初期値に戻す</SecondaryButton>
          <PrimaryButton onClick={() => toast.show("送信スケジュールを保存しました", "success")}>保存</PrimaryButton>
        </div>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          基本送信ウィンドウ <HelpHint>個別ルールが設定されていない自動送信のデフォルト時間帯。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">送信開始時刻</span>
            <input
              type="time"
              value={defaultStart}
              onChange={(e) => setDefaultStart(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">送信終了時刻</span>
            <input
              type="time"
              value={defaultEnd}
              onChange={(e) => setDefaultEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">休業日扱い</span>
            <select
              value={holidayMode}
              onChange={(e) => setHolidayMode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            >
              <option value="skip">送信しない（翌営業日にずらす）</option>
              <option value="send">通常通り送信</option>
              <option value="hold">送信ホールド（要オペレーター操作）</option>
            </select>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">トリガー別ルール</div>
          <SecondaryButton onClick={() => toast.show("新規ルールを追加します", "info")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />ルール追加</span>
          </SecondaryButton>
        </div>
        <div className="divide-y divide-white/40">
          {rules.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-800">{r.trigger}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", r.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-gray-500/15 text-gray-500")}>
                    {r.enabled ? "有効" : "無効"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => updateRule(r.id, { enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">送信開始</span>
                  <input
                    type="time"
                    value={r.windowStart}
                    onChange={(e) => updateRule(r.id, { windowStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">送信終了</span>
                  <input
                    type="time"
                    value={r.windowEnd}
                    onChange={(e) => updateRule(r.id, { windowEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs text-gray-500">時間外キュー</span>
                  <select
                    value={r.outsideAction}
                    onChange={(e) => updateRule(r.id, { outsideAction: e.target.value as ScheduleRule["outsideAction"] })}
                    className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
                  >
                    <option value="next-business-day">翌営業日に送信</option>
                    <option value="send-immediately">通常通り送信</option>
                    <option value="hold">送信ホールド</option>
                  </select>
                </label>
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">送信曜日</div>
                <div className="flex gap-2">
                  {dows.map((d, idx) => (
                    <button
                      key={d}
                      onClick={() => toggleDow(r.id, idx)}
                      className={cn(
                        "h-9 w-9 rounded-lg text-xs font-medium border transition-colors",
                        r.daysOfWeek.includes(idx)
                          ? "bg-blue-500/80 text-white border-blue-400/50"
                          : "bg-white/70 text-gray-500 border-white/60 hover:bg-white/90"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2">
            休業日カレンダー <HelpHint>祝日・店舗休業日を登録すると、送信ウィンドウ計算から除外されます。</HelpHint>
          </h2>
          <SecondaryButton onClick={() => toast.show("休業日を追加しました", "success")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />追加</span>
          </SecondaryButton>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <DatePicker placeholder="休業日を選択" />
          <input type="text" placeholder="休業日名（例: 棚卸し）" className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {holidays.map((h) => (
            <div key={h.date} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/60">
              <div>
                <div className="text-sm font-medium text-gray-800">{h.name}</div>
                <div className="text-xs text-gray-500">{h.date}</div>
              </div>
              <button
                onClick={() => toast.show(`${h.name} を削除しました`, "info")}
                className="p-1.5 rounded-lg text-red-700 hover:bg-red-500/15"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
