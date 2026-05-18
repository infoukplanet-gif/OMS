"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";

const tabs = ["規定値設定", "支払方法別手数料", "支払発送変換", "日付自動登録", "除外地域"] as const;
type TabKey = (typeof tabs)[number];

interface DefaultRow {
  key: string;
  label: string;
  value: string;
}

interface FeeRow {
  method: string;
  fee: string;
  note: string;
}

interface ConversionRow {
  type: "支払方法" | "発送方法";
  from: string;
  to: string;
  shop: string;
}

interface DateRuleRow {
  name: string;
  rule: string;
}

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

const INITIAL_DEFAULTS: DefaultRow[] = [
  { key: "payment", label: "デフォルト支払方法", value: "クレジットカード" },
  { key: "shipping", label: "デフォルト配送方法", value: "ヤマト運輸" },
  { key: "warehouse", label: "デフォルト倉庫", value: "東京本社倉庫" },
  { key: "tax", label: "税率", value: "10%" },
  { key: "fee", label: "送料（標準）", value: "¥800" },
  { key: "freeShip", label: "送料無料条件", value: "¥10,000以上" },
];

const INITIAL_FEES: FeeRow[] = [
  { method: "クレジットカード", fee: "0%", note: "" },
  { method: "銀行振込", fee: "0%", note: "振込手数料は顧客負担" },
  { method: "代金引換", fee: "¥330", note: "一律" },
  { method: "請求書払い", fee: "0%", note: "卸先のみ" },
];

const INITIAL_CONVERSIONS: ConversionRow[] = [
  { type: "支払方法", from: "クレジットカード", to: "クレジット", shop: "楽天市場" },
  { type: "支払方法", from: "銀行振込（前払）", to: "銀行振込", shop: "Yahoo!" },
  { type: "発送方法", from: "ヤマト宅急便", to: "ヤマト運輸", shop: "全店舗" },
  { type: "発送方法", from: "佐川飛脚便", to: "佐川急便", shop: "全店舗" },
];

const INITIAL_DATE_RULES: DateRuleRow[] = [
  { name: "出荷予定日", rule: "受注日 + 1営業日" },
  { name: "お届け予定日", rule: "出荷予定日 + 2営業日" },
  { name: "支払期限日", rule: "受注日 + 7日" },
  { name: "請求日", rule: "月末締" },
];

export default function OrderRulesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabKey>(tabs[0]);

  const [defaults, setDefaults] = useState<DefaultRow[]>(INITIAL_DEFAULTS);
  const [fees, setFees] = useState<FeeRow[]>(INITIAL_FEES);
  const [conversions, setConversions] = useState<ConversionRow[]>(INITIAL_CONVERSIONS);
  const [dateRules, setDateRules] = useState<DateRuleRow[]>(INITIAL_DATE_RULES);
  const [excludedAreas, setExcludedAreas] = useState<Set<string>>(new Set());

  // 編集中の手数料行: method → 編集中の {fee, note}
  const [editingFee, setEditingFee] = useState<string | null>(null);
  // 編集中の日付ルール行: name → 編集中の rule（v1 はバリデーション無し）
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const updateDefault = (key: string, value: string) =>
    setDefaults((prev) => prev.map((d) => (d.key === key ? { ...d, value } : d)));

  const updateFee = (method: string, patch: Partial<FeeRow>) =>
    setFees((prev) => prev.map((f) => (f.method === method ? { ...f, ...patch } : f)));

  const updateDateRule = (name: string, rule: string) =>
    setDateRules((prev) => prev.map((d) => (d.name === name ? { ...d, rule } : d)));

  const toggleArea = (prefecture: string) => {
    setExcludedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(prefecture)) next.delete(prefecture);
      else next.add(prefecture);
      return next;
    });
  };

  const addConversion = () => {
    setConversions((prev) => [
      ...prev,
      { type: "支払方法", from: "新規モール側", to: "新規本システム側", shop: "全店舗" },
    ]);
  };

  const removeConversion = (idx: number) => {
    setConversions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateConversion = (idx: number, patch: Partial<ConversionRow>) => {
    setConversions((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    );
  };

  // 保存ハンドラ。v1 はトーストのみ（永続化は v2 で server action + DB）。
  const handleSaveDefaults = () => toast.show("規定値設定を保存しました", "success");
  const handleSaveFees = () => {
    setEditingFee(null);
    toast.show("手数料設定を保存しました", "success");
  };
  const handleSaveConversions = () => toast.show("変換ルールを保存しました", "success");
  const handleSaveDateRules = () => {
    setEditingRule(null);
    toast.show("日付自動登録ルールを保存しました", "success");
  };
  const handleSaveAreas = () =>
    toast.show(
      `除外地域を保存しました（${excludedAreas.size}件）`,
      excludedAreas.size > 0 ? "info" : "success",
    );

  const excludedSummary = useMemo(() => {
    if (excludedAreas.size === 0) return "除外なし";
    if (excludedAreas.size <= 3) return Array.from(excludedAreas).join("・");
    return `${Array.from(excludedAreas).slice(0, 3).join("・")} ほか ${excludedAreas.size - 3} 県`;
  }, [excludedAreas]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注設定</h1>
        <div className="text-xs text-gray-500">
          {tab === "除外地域" && `現在の除外地域: ${excludedSummary}`}
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 rounded-xl text-sm transition-all",
              tab === t
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:bg-white/40",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 規定値設定 */}
      {tab === "規定値設定" && (
        <GlassCard>
          <div className="space-y-3">
            {defaults.map((d) => (
              <div key={d.key} className="flex items-center justify-between p-3 rounded-xl bg-white/40">
                <span className="text-sm text-gray-700">{d.label}</span>
                <input
                  value={d.value}
                  onChange={(e) => updateDefault(d.key, e.target.value)}
                  className="h-8 w-48 px-3 rounded-lg text-sm text-right bg-white/50 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveDefaults}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            保存
          </button>
        </GlassCard>
      )}

      {/* 支払方法別手数料 */}
      {tab === "支払方法別手数料" && (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">支払方法</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">手数料</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">備考</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => {
                const isEditing = editingFee === f.method;
                return (
                  <tr key={f.method} className="border-t border-white/30 hover:bg-white/40">
                    <td className="px-4 py-3 text-gray-800">{f.method}</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-700">
                      {isEditing ? (
                        <input
                          value={f.fee}
                          onChange={(e) => updateFee(f.method, { fee: e.target.value })}
                          className="h-7 w-20 px-2 rounded text-sm text-center bg-white border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />
                      ) : (
                        f.fee
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {isEditing ? (
                        <input
                          value={f.note}
                          onChange={(e) => updateFee(f.method, { note: e.target.value })}
                          className="h-7 w-full px-2 rounded text-xs bg-white border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        />
                      ) : (
                        f.note || "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => setEditingFee(null)}
                          className="px-3 py-1 rounded-lg text-xs bg-blue-500/15 border border-blue-300 text-blue-700 hover:bg-blue-500/25"
                        >
                          完了
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingFee(f.method)}
                          className="px-3 py-1 rounded-lg text-xs bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80"
                        >
                          編集
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-white/40 bg-white/30 flex justify-end">
            <button
              onClick={handleSaveFees}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
            >
              保存
            </button>
          </div>
        </GlassCard>
      )}

      {/* 支払発送変換 */}
      {tab === "支払発送変換" && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-2">支払発送変換設定</h2>
          <p className="text-sm text-gray-500 mb-4">
            モール側の支払方法・発送方法を本システムの名称に変換するルールを設定します。
          </p>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">種別</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">モール側</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">本システム</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">店舗</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-16">削除</th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((r, i) => (
                  <tr key={i} className="border-t border-white/30 hover:bg-white/40">
                    <td className="px-3 py-2">
                      <select
                        value={r.type}
                        onChange={(e) =>
                          updateConversion(i, { type: e.target.value as ConversionRow["type"] })
                        }
                        className="h-7 px-2 rounded text-xs bg-white border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      >
                        <option value="支払方法">支払方法</option>
                        <option value="発送方法">発送方法</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.from}
                        onChange={(e) => updateConversion(i, { from: e.target.value })}
                        className="h-7 w-full px-2 rounded text-xs bg-white border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.to}
                        onChange={(e) => updateConversion(i, { to: e.target.value })}
                        className="h-7 w-full px-2 rounded text-xs bg-white border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.shop}
                        onChange={(e) => updateConversion(i, { shop: e.target.value })}
                        className="h-7 w-full px-2 rounded text-xs bg-white border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeConversion(i)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={addConversion}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
            >
              変換ルールを追加
            </button>
            <button
              onClick={handleSaveConversions}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
            >
              保存
            </button>
          </div>
        </GlassCard>
      )}

      {/* 日付自動登録 */}
      {tab === "日付自動登録" && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-2">日付自動登録設定</h2>
          <p className="text-sm text-gray-500 mb-4">
            受注取込時に自動的に設定する日付項目のルールを設定します。
          </p>
          <div className="space-y-2">
            {dateRules.map((r) => {
              const isEditing = editingRule === r.name;
              return (
                <div
                  key={r.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/40"
                >
                  <span className="text-sm font-medium text-gray-800">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      value={r.rule}
                      onChange={(e) => updateDateRule(r.name, e.target.value)}
                      readOnly={!isEditing}
                      className={cn(
                        "h-8 w-56 px-3 rounded-lg text-sm text-right border focus:outline-none",
                        isEditing
                          ? "bg-white border-blue-300 focus:ring-1 focus:ring-blue-500/20"
                          : "bg-white/50 border-white/50",
                      )}
                    />
                    {isEditing ? (
                      <button
                        onClick={() => setEditingRule(null)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        完了
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingRule(r.name)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        編集
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSaveDateRules}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
          >
            保存
          </button>
        </GlassCard>
      )}

      {/* 除外地域 */}
      {tab === "除外地域" && (
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-800">除外地域の設定</h2>
            <span className="text-xs text-gray-500">{excludedAreas.size} / {PREFECTURES.length} 件選択中</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            配送対象外とする地域を設定します。受注時に警告が表示されます。
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PREFECTURES.map((p) => {
              const checked = excludedAreas.has(p);
              return (
                <label
                  key={p}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                    checked ? "bg-red-500/10 ring-1 ring-red-300" : "bg-white/40 hover:bg-white/60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={checked}
                    onChange={() => toggleArea(p)}
                  />
                  <span className={cn("text-xs", checked ? "text-red-700 font-medium" : "text-gray-700")}>{p}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setExcludedAreas(new Set())}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
            >
              すべて解除
            </button>
            <button
              onClick={handleSaveAreas}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
            >
              保存
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
