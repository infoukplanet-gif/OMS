"use client";
import { useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Upload, AlertTriangle, CheckCircle, Download, Trash2 } from "lucide-react";

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

function parseCsvCodes(text: string): string[] {
  return text
    .split(/[\r\n,]+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0);
}

export default function MasterDeletePage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.show("CSVまたはTXTファイルを選択してください", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const parsed = parseCsvCodes(text);
      setFileName(file.name);
      setCodes(parsed);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = () => {
    if (!target || !agreed || codes.length === 0) return;
    const targetLabel = target === "product" ? "商品マスタ" : target === "set" ? "セット商品マスタ" : target === "supplier" ? "仕入先マスタ" : "卸先マスタ";
    toast.show(`${targetLabel}から ${codes.length} 件を削除しました`, "success");
    setFileName(null);
    setCodes([]);
    setAgreed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                isDragOver ? "border-blue-400 bg-blue-50/60" : "border-gray-300/50 bg-white/30 hover:bg-white/50"
              )}
            >
              {fileName ? (
                <>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-gray-800">{fileName}</p>
                  <p className="text-xs text-emerald-600">{codes.length} 件のコードを読み込みました</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">CSVファイルをドラッグ＆ドロップ または クリックして選択</p>
                  <p className="text-xs text-gray-400">削除対象のコードを記載したCSVファイル</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
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
            onClick={handleDelete}
            disabled={!target || !agreed || codes.length === 0}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
              target && agreed && codes.length > 0
                ? "bg-red-500/80 border border-red-400/50 text-white hover:bg-red-500/90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {codes.length > 0 ? `${codes.length} 件を削除する` : "CSVファイルをアップロード"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
