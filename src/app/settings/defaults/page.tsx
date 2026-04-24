"use client";
import { GlassCard } from "@/components/ui/glass-card";

export default function DefaultsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">規定値設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            受注・商品・顧客登録時のデフォルト値を設定します。
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90 shadow-sm">
          変更を保存
        </button>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">受注の規定値</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="デフォルト店舗" value="本店" />
          <Field label="デフォルト倉庫" value="東京倉庫" />
          <Field label="デフォルト受注区分" value="一般" />
          <Field label="デフォルト支払方法" value="クレジットカード" />
          <Field label="デフォルト配送方法" value="ヤマト運輸" />
          <Field label="デフォルト税率" value="10%" />
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">商品の規定値</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="デフォルト販売区分" value="通常販売" />
          <Field label="デフォルト税区分" value="内税" />
          <Field label="デフォルト引当倉庫" value="東京倉庫" />
          <Field label="デフォルト在庫管理区分" value="管理する" />
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">顧客の規定値</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="デフォルト顧客区分" value="一般顧客" />
          <Field label="デフォルト取引条件" value="先払い" />
          <Field label="デフォルト締日" value="月末" />
          <Field label="デフォルト支払サイト" value="翌月末" />
        </div>
      </GlassCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
      />
    </div>
  );
}
