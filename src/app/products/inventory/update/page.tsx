"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const history = [
  { id: "INV-UPD-20260414-003", type: "モール在庫連携", target: "楽天市場", started: "2026-04-14 10:30", ended: "2026-04-14 10:31", updated: 142, result: "成功" },
  { id: "INV-UPD-20260414-002", type: "倉庫API在庫取込", target: "東京倉庫", started: "2026-04-14 09:15", ended: "2026-04-14 09:16", updated: 58, result: "成功" },
  { id: "INV-UPD-20260414-001", type: "CSV手動取込", target: "大阪倉庫", started: "2026-04-14 08:40", ended: "2026-04-14 08:40", updated: 12, result: "成功" },
  { id: "INV-UPD-20260413-045", type: "モール在庫連携", target: "Yahoo!ショッピング", started: "2026-04-13 23:00", ended: "2026-04-13 23:02", updated: 205, result: "部分成功" },
];

const rb: Record<string, string> = {
  成功: "bg-emerald-500/15 text-emerald-700",
  部分成功: "bg-amber-500/15 text-amber-700",
  失敗: "bg-red-500/15 text-red-700",
};

export default function InventoryUpdatePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">在庫更新処理</h1>
        <p className="text-sm text-gray-500 mt-1">
          モール・倉庫・CSV取込による在庫数の一括更新処理を実行します。実在庫との差分はログに記録されます。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">モール在庫連携</h3>
          <p className="text-xs text-gray-500 mb-4">各モールから最新在庫を取得して自社在庫を更新</p>
          <button className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90">
            実行
          </button>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">倉庫API在庫取込</h3>
          <p className="text-xs text-gray-500 mb-4">倉庫管理システムAPIから実在庫を取得</p>
          <button className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/90 text-white hover:bg-blue-600/90">
            実行
          </button>
        </GlassCard>
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">CSV手動取込</h3>
          <p className="text-xs text-gray-500 mb-4">CSVファイルから在庫数を一括更新</p>
          <button className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-white/70 border border-white/60 text-gray-700 hover:bg-white/90">
            ファイル選択
          </button>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">実行履歴</h2>
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">処理ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">種別</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">対象</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">開始</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">終了</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">更新件数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">結果</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-white/30 hover:bg-white/40">
                  <td className="px-4 py-3 text-xs text-gray-500">{h.id}</td>
                  <td className="px-4 py-3 text-gray-700">{h.type}</td>
                  <td className="px-4 py-3 text-gray-700">{h.target}</td>
                  <td className="px-4 py-3 text-gray-600">{h.started}</td>
                  <td className="px-4 py-3 text-gray-600">{h.ended}</td>
                  <td className="px-4 py-3 text-right text-gray-800">{h.updated}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", rb[h.result])}>
                      {h.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25">
                      ログ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
