"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { Save, Calculator, History } from "lucide-react";

type Fee = {
  id: string;
  method: string;
  rate: number;
  fixed: number;
  minAmt: number;
  maxAmt: number | null;
  taxIncluded: boolean;
  active: boolean;
  scope: "顧客負担" | "自社負担";
};

const INITIAL: Fee[] = [
  { id: "F-01", method: "クレジットカード", rate: 3.25, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-02", method: "代金引換", rate: 0, fixed: 330, minAmt: 0, maxAmt: 10000, taxIncluded: true, active: true, scope: "顧客負担" },
  { id: "F-03", method: "NP後払い", rate: 3.6, fixed: 190, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-04", method: "Atone", rate: 2.9, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-05", method: "銀行振込", rate: 0, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "顧客負担" },
  { id: "F-06", method: "コンビニ後払い", rate: 4, fixed: 210, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-07", method: "Yahoo!かんたん決済", rate: 3.45, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
  { id: "F-08", method: "楽天ペイ", rate: 3.3, fixed: 0, minAmt: 0, maxAmt: null, taxIncluded: false, active: true, scope: "自社負担" },
];

const HISTORY = [
  { id: 1, at: "2026-04-22 11:42", who: "佐藤 健", target: "クレジットカード", change: "3.30% → 3.25%" },
  { id: 2, at: "2026-04-15 14:08", who: "鈴木 美咲", target: "Atone", change: "3.10% → 2.90%" },
  { id: 3, at: "2026-04-01 10:00", who: "佐藤 健", target: "代金引換", change: "下限額 0 → 0、上限 10,000円追加" },
];

export default function PaymentFeesPage() {
  const toast = useToast();
  const [fees, setFees] = useState<Fee[]>(INITIAL);

  const update = <K extends keyof Fee>(id: string, key: K, value: Fee[K]) =>
    setFees(fees.map((f) => (f.id === id ? { ...f, [key]: value } : f)));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">支払方法別手数料設定</h1>
            <HelpHint>
              支払方法ごとの決済手数料・代引手数料を設定します。{"\n"}
              「自社負担」は会計上の費用、「顧客負担」は受注金額に上乗せされます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            登録: <span className="font-semibold">{fees.length}件</span> ／ 有効:{" "}
            <span className="font-semibold text-emerald-700">{fees.filter((f) => f.active).length}件</span>
          </p>
        </div>
        <PrimaryButton onClick={() => toast.show("手数料設定を保存しました", "success")}>
          <Save className="h-4 w-4" />変更を保存
        </PrimaryButton>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">支払方法</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">手数料率(%)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">固定額(円)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">下限</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">上限</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">税込</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">負担</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">有効</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-4 py-3 font-medium text-gray-800">{f.method}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={f.rate}
                    onChange={(e) => update(f.id, "rate", Number(e.target.value))}
                    className="w-20 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={f.fixed}
                    onChange={(e) => update(f.id, "fixed", Number(e.target.value))}
                    className="w-20 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={f.minAmt}
                    onChange={(e) => update(f.id, "minAmt", Number(e.target.value))}
                    className="w-24 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={f.maxAmt ?? ""}
                    placeholder="上限なし"
                    onChange={(e) => update(f.id, "maxAmt", e.target.value === "" ? null : Number(e.target.value))}
                    className="w-24 h-8 px-2 rounded-lg text-sm text-right bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={f.taxIncluded} onChange={(e) => update(f.id, "taxIncluded", e.target.checked)} className="accent-blue-500 w-4 h-4" />
                </td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={f.scope}
                    onChange={(e) => update(f.id, "scope", e.target.value as Fee["scope"])}
                    className="h-7 px-2 rounded-lg text-xs bg-white/60 border border-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="自社負担">自社負担</option>
                    <option value="顧客負担">顧客負担</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={f.active} onChange={(e) => update(f.id, "active", e.target.checked)} className="accent-blue-500 w-4 h-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">計算ルール</h2>
        </div>
        <p className="text-sm text-gray-700 leading-7">
          手数料は <span className="font-mono bg-blue-500/10 px-2 py-0.5 rounded">手数料率 × 受注金額 + 固定額</span> で算出されます。{" "}
          下限額・上限額が設定されている場合は、その範囲内に丸め込まれます。{" "}
          税区分は企業設定の「手数料税区分」に従い、「税込」チェック時はその金額をそのまま採用します。
        </p>
        <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          <li className="px-3 py-2 rounded-xl bg-white/50">例: クレカ 3.25% → 10,000円注文の手数料 = 325円</li>
          <li className="px-3 py-2 rounded-xl bg-white/50">例: 代引 330円(税込)・上限10,000円 → 注文額に関係なく330円</li>
        </ul>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">変更履歴</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作者</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">変更内容</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-3 py-2 text-xs text-gray-700 tabular-nums">{h.at}</td>
                  <td className="px-3 py-2 text-gray-700">{h.who}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{h.target}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{h.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
