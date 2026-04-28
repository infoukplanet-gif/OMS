"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Save, Calendar, Truck, Package, Clock } from "lucide-react";

type Holiday = { date: string; label: string };

export default function ShipmentsAvailabilityPage() {
  const toast = useToast();
  const [stockMode, setStockMode] = useState<"reserved" | "actual">("reserved");
  const [reserveOnImport, setReserveOnImport] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [autoAlternative, setAutoAlternative] = useState(false);
  const [allowSetSplit, setAllowSetSplit] = useState(true);
  const [shippingDays, setShippingDays] = useState({ ヤマト: 1, 佐川: 1, 日本郵便: 2, 西濃: 2 });
  const [cutoffByCarrier, setCutoffByCarrier] = useState({ ヤマト: "15:00", 佐川: "14:00", 日本郵便: "13:00", 西濃: "12:00" });
  const [restDays, setRestDays] = useState<("月" | "火" | "水" | "木" | "金" | "土" | "日")[]>(["日"]);
  const [holidays] = useState<Holiday[]>([
    { date: "2026-04-29", label: "昭和の日" },
    { date: "2026-05-03", label: "憲法記念日" },
    { date: "2026-05-04", label: "みどりの日" },
    { date: "2026-05-05", label: "こどもの日" },
    { date: "2026-08-13", label: "夏季休業" },
    { date: "2026-08-14", label: "夏季休業" },
    { date: "2026-08-15", label: "夏季休業" },
  ]);

  const handleSave = () => {
    toast.show("出荷可能設定を保存しました", "success");
  };

  const toggleRestDay = (d: typeof restDays[number]) => {
    setRestDays(restDays.includes(d) ? restDays.filter((x) => x !== d) : [...restDays, d]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">出荷可能設定</h1>
            <HelpHint>
              出荷可能数量の判定ルール、引当タイミング、配送業者ごとの締切時間、休業日などを設定します。{"\n"}
              ここでの設定は受注取込・出荷指示の自動判定で利用されます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            在庫引当ルール・締切時刻・休業カレンダーを一括管理します。
          </p>
        </div>
        <PrimaryButton onClick={handleSave}>
          <Save className="h-4 w-4" />設定を保存
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">在庫引当ルール</h2>
          <HelpHint>受注取込時に在庫をどのように引当・確認するかを規定します。</HelpHint>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              在庫数の判定基準
              <HelpHint side="right">「引当ベース」は予約も差し引いた残数。「実在庫」は物理在庫のみで判定。</HelpHint>
            </label>
            <select
              value={stockMode}
              onChange={(e) => setStockMode(e.target.value as "reserved" | "actual")}
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="reserved">引当ベース（予約済み数を差し引く）</option>
              <option value="actual">実在庫ベース（物理在庫のみで判定）</option>
            </select>
          </div>
          <Toggle label="受注取込時に自動引当" checked={reserveOnImport} onChange={setReserveOnImport} hint="OFFの場合、出荷指示時に引当します。" />
          <Toggle label="バックオーダー（在庫切れでも受注）を許可" checked={allowBackorder} onChange={setAllowBackorder} hint="許可すると在庫不足でも受注を確定できます。" />
          <Toggle label="代替商品の自動提案" checked={autoAlternative} onChange={setAutoAlternative} hint="在庫切れ時に代替商品マスタから自動提案します。" />
          <Toggle label="セット商品の分割出荷を許可" checked={allowSetSplit} onChange={setAllowSetSplit} hint="セット商品の在庫が一部足りない場合、足りる分だけ先に出荷します。" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">配送業者別 リードタイム・締切</h2>
          <HelpHint>受注確定〜出荷までの所要日数と、当日出荷扱いの締切時刻。</HelpHint>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">配送業者</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">出荷リードタイム</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">当日締切時刻</th>
              </tr>
            </thead>
            <tbody>
              {(["ヤマト", "佐川", "日本郵便", "西濃"] as const).map((c) => (
                <tr key={c} className="border-t border-white/30">
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{c}</td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="number"
                      value={shippingDays[c]}
                      onChange={(e) => setShippingDays({ ...shippingDays, [c]: Number(e.target.value) })}
                      className="w-20 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="ml-1 text-xs text-gray-500">日</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="text"
                      value={cutoffByCarrier[c]}
                      onChange={(e) => setCutoffByCarrier({ ...cutoffByCarrier, [c]: e.target.value })}
                      className="w-20 h-8 px-2 rounded-lg text-sm text-center bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">出荷休業設定</h2>
          <HelpHint>定休日・祝日・特別休業日を設定。出荷予定日の自動計算で除外されます。</HelpHint>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">毎週の定休日</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["月", "火", "水", "木", "金", "土", "日"] as const).map((d) => (
              <button
                key={d}
                onClick={() => toggleRestDay(d)}
                className={cn(
                  "h-10 w-10 rounded-xl text-sm font-medium transition-colors",
                  restDays.includes(d)
                    ? "bg-red-500/15 border border-red-300/50 text-red-700"
                    : "bg-white/50 border border-white/50 text-gray-600 hover:bg-white/70"
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">登録済み祝日・特別休業日</p>
          <div className="flex flex-wrap gap-2">
            {holidays.map((h) => (
              <span
                key={h.date}
                className="px-3 py-1 rounded-lg text-xs bg-white/50 border border-white/50 text-gray-700"
              >
                <Clock className="inline-block h-3 w-3 mr-1 text-gray-400" />
                {h.date}（{h.label}）
              </span>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-gray-800">設定の影響範囲</h2>
        </div>
        <ul className="text-sm text-gray-700 space-y-1.5">
          <li>• 受注取込時の引当判定（在庫切れフラグ）</li>
          <li>• 出荷指示画面の出荷可能リスト生成</li>
          <li>• お客様マイページの「お届け予定日」表示</li>
          <li>• 楽天/Amazon/Yahoo!モール連携時の出荷予定日</li>
          <li>• 自動メール「ご注文ありがとうございます」のお届け予定日差し込み</li>
        </ul>
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
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-4 h-4" />
    </label>
  );
}
