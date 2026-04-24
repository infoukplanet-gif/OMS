"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Upload, AlertTriangle, Download, Trash2 } from "lucide-react";

const restrictions = [
  {
    name: "商品マスタ",
    items: [
      "該当の商品コードを含むセット商品マスタが存在する場合は削除できません。",
      "該当の商品コードの明細行がキャンセルされていない受注伝票が存在する場合は削除できません。（出荷確定済みの受注伝票は除く）",
      "該当の商品コードを含む発注伝票が存在する場合は削除できません。（仕入完了やキャンセルの発注伝票は除く）",
    ],
  },
  {
    name: "仕入先マスタ",
    items: [
      "該当の仕入先コードを含む商品マスタ、仕入完了以外の発注伝票が存在する場合は削除できません。",
      "仕入マスタに紐づく発注・仕入伝票は削除されます。",
    ],
  },
  {
    name: "卸先マスタ",
    items: [
      "該当の卸先コードを含む受注伝票が存在する場合は削除できません。",
    ],
  },
  {
    name: "セット商品マスタ",
    items: [
      "特に制限はございません。",
    ],
  },
];

export default function MasterDeletePage() {
  const [target, setTarget] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">マスタ削除</h1>
        <p className="text-sm text-gray-500 mt-1">商品・セット商品・仕入先・卸先マスタをCSVファイルで一括削除します。</p>
      </div>

      <GlassCard className="bg-red-500/5 border-red-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">削除操作は元に戻せません。</p>
            <p className="text-xs mt-1">代表商品コード・セット商品コードのいずれにも紐づいていないページは削除されますのでご注意ください。</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-3">各マスタの削除制限</h2>
        <div className="space-y-4">
          {restrictions.map((r) => (
            <div key={r.name}>
              <p className="text-sm font-medium text-gray-700 mb-1.5">【{r.name}】</p>
              <ul className="space-y-1 ml-4">
                {r.items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4">削除するCSVファイルをアップロード</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">削除するマスタ <span className="text-red-500 text-xs">*必須</span></label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">選択してください</option>
                <option value="product">商品マスタ</option>
                <option value="set">セット商品マスタ</option>
                <option value="supplier">仕入先マスタ</option>
                <option value="wholesale">卸先マスタ</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
                <Download className="h-4 w-4" />
                CSVテンプレートをダウンロード
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">コードCSVファイル</label>
            <div className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-gray-300/50 bg-white/30 hover:bg-white/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">CSVファイルをドラッグ＆ドロップ または クリックして選択</p>
              <p className="text-xs text-gray-400">削除対象のコードを記載したCSVファイル</p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">上記の注意事項に了承します</span>
          </label>
        </div>

        <div className="flex justify-end mt-5">
          <button
            disabled={!target || !agreed}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
              target && agreed
                ? "bg-red-500/80 border border-red-400/50 text-white hover:bg-red-500/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Trash2 className="h-4 w-4" />
            削除するCSVファイルをアップロード
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
