"use client";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";

type Rules = {
  paymentUnset: boolean;
  amountLimit: boolean;
  amountLimitValue: number;
  addressInvalid: boolean;
  blacklistCustomer: boolean;
  duplicateSameDay: boolean;
  noteFilled: boolean;
  outOfStock: boolean;
  firstTimeCustomer: boolean;
};

const defaults: Rules = {
  paymentUnset: true,
  amountLimit: true,
  amountLimitValue: 100000,
  addressInvalid: true,
  blacklistCustomer: true,
  duplicateSameDay: false,
  noteFilled: false,
  outOfStock: true,
  firstTimeCustomer: false,
};

export default function ConfirmSettingsPage() {
  const toast = useToast();
  const [saved, setSaved] = useState<Rules>(defaults);
  const [draft, setDraft] = useState<Rules>(defaults);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function upd<K extends keyof Rules>(k: K, v: Rules[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }));
  }
  function save() {
    if (draft.amountLimit && draft.amountLimitValue <= 0) {
      return toast.show("金額上限は1円以上で入力してください", "error");
    }
    setSaved(draft);
    toast.show("確認内容設定を保存しました");
  }
  function reset() {
    setDraft(saved);
    toast.show("変更を取消しました", "info");
  }

  const rules: { key: keyof Rules; label: string; desc: string }[] = [
    { key: "paymentUnset", label: "支払方法チェック", desc: "支払方法が未設定の場合に確認ステータスへ" },
    { key: "amountLimit", label: "金額上限チェック", desc: "合計金額が一定額以上の場合に確認" },
    { key: "addressInvalid", label: "住所不備チェック", desc: "住所が未入力・不正な場合に確認" },
    { key: "blacklistCustomer", label: "ブラック顧客チェック", desc: "ブラックリスト登録顧客の場合に確認" },
    { key: "duplicateSameDay", label: "同一顧客重複チェック", desc: "同日に同一顧客から複数注文がある場合" },
    { key: "noteFilled", label: "備考欄チェック", desc: "備考欄に記入がある場合に確認" },
    { key: "outOfStock", label: "在庫不足チェック", desc: "在庫が引当できない場合に確認" },
    { key: "firstTimeCustomer", label: "初回顧客チェック", desc: "初めて注文する顧客の場合に確認" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">受注確認内容設定</h1>
        <div className="flex gap-2">
          <SecondaryButton onClick={reset}>取消</SecondaryButton>
          <PrimaryButton onClick={save} disabled={!dirty}>保存</PrimaryButton>
        </div>
      </div>

      <GlassCard>
        <p className="text-sm text-gray-500 mb-4">
          受注を「確認待ち」ステータスにする条件を設定します。有効にしたルールに合致した受注は自動で確認待ちに振り分けられます。
        </p>
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.key} className="p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft[r.key] as boolean}
                    onChange={(e) => upd(r.key, e.target.checked as Rules[typeof r.key])}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              {r.key === "amountLimit" && draft.amountLimit && (
                <div className="mt-3 pt-3 border-t border-white/40 flex items-center gap-2">
                  <label className="text-xs text-gray-500">金額上限</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">¥</span>
                    <input
                      type="number"
                      min={1}
                      value={draft.amountLimitValue}
                      onChange={(e) => upd("amountLimitValue", Number(e.target.value) || 0)}
                      className="w-40 pl-7 pr-3 py-1.5 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 tabular-nums"
                    />
                  </div>
                  <span className="text-xs text-gray-500">以上で確認待ち</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {dirty && (
        <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          未保存の変更があります
        </p>
      )}
    </div>
  );
}
