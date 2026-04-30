"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus, Search, Trash2 } from "lucide-react";

type SkuMap = {
  id: string;
  omsCode: string;
  omsName: string;
  rslSku: string;
  rslName: string;
  upc: string;
  status: "登録済" | "申請中" | "未登録" | "保留";
  registeredAt: string;
};

const initial: SkuMap[] = [
  { id: "1", omsCode: "P-001", omsName: "コットンTシャツ ホワイト M", rslSku: "RSL-OMS-001-WH-M", rslName: "Cotton Tee White M", upc: "4901234567890", status: "登録済", registeredAt: "2026/01/15" },
  { id: "2", omsCode: "P-001-L", omsName: "コットンTシャツ ホワイト L", rslSku: "RSL-OMS-001-WH-L", rslName: "Cotton Tee White L", upc: "4901234567891", status: "登録済", registeredAt: "2026/01/15" },
  { id: "3", omsCode: "P-002", omsName: "デニムジャケット M", rslSku: "RSL-OMS-002-DM-M", rslName: "Denim Jacket M", upc: "4901234567892", status: "登録済", registeredAt: "2026/02/01" },
  { id: "4", omsCode: "P-003", omsName: "ステンレスタンブラー 350ml", rslSku: "RSL-OMS-003-350", rslName: "SS Tumbler 350ml", upc: "4901234567893", status: "登録済", registeredAt: "2026/02/15" },
  { id: "5", omsCode: "P-099", omsName: "新商品テスト", rslSku: "—", rslName: "—", upc: "—", status: "未登録", registeredAt: "—" },
  { id: "6", omsCode: "P-008", omsName: "ストーンウェアマグ", rslSku: "RSL-OMS-008", rslName: "Stoneware Mug", upc: "4901234567898", status: "申請中", registeredAt: "2026/04/28" },
  { id: "7", omsCode: "P-100", omsName: "リネンエプロン グリーン", rslSku: "—", rslName: "—", upc: "—", status: "保留", registeredAt: "—" },
];

const sb: Record<string, string> = {
  登録済: "bg-emerald-500/15 text-emerald-700",
  申請中: "bg-amber-500/15 text-amber-700",
  未登録: "bg-gray-500/15 text-gray-500",
  保留: "bg-rose-500/15 text-rose-700",
};

export default function RsrLogiSetupPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SkuMap["status"]>("all");
  const [companyId, setCompanyId] = useState("RAK-OMS-CORP-0042");
  const [warehouseId, setWarehouseId] = useState("RSL-CHIBA-A");
  const [contractType, setContractType] = useState("通常契約");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return items.filter((i) => {
      if (k && !`${i.omsCode} ${i.omsName} ${i.rslSku}`.toLowerCase().includes(k)) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      return true;
    });
  }, [items, keyword, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">RSL 初期登録 / SKUマッピング</h1>
            <HelpHint>RSLとの初期接続情報、契約倉庫、SKUマッピング（OMS商品コード ⇔ RSL SKU）を管理します。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">RSL利用開始時の各種登録情報と、商品コードのRSL SKUマッピングをここで管理します。</p>
        </div>
        <PrimaryButton onClick={() => toast.show("RSL初期登録を保存しました", "success")}>保存</PrimaryButton>
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-gray-800 mb-3 inline-flex items-center gap-2">
          基本登録情報 <HelpHint>RSL契約時に楽天から付与される企業ID・倉庫IDを登録します。</HelpHint>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">RSL企業ID</span>
            <input value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60 font-mono" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">契約倉庫ID</span>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              {["RSL-CHIBA-A", "RSL-CHIBA-B", "RSL-OSAKA-A", "RSL-FUKUOKA-A"].map((w) => <option key={w}>{w}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">契約種別</span>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
              <option>通常契約</option>
              <option>大量出荷契約</option>
              <option>セール特化契約</option>
            </select>
          </label>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録SKU</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">登録済</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{items.filter((i) => i.status === "登録済").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">申請中</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{items.filter((i) => i.status === "申請中").length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-xs text-gray-500">未登録</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{items.filter((i) => i.status === "未登録").length}</div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="商品コード・SKU・商品名"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 rounded-xl text-sm bg-white/70 border border-white/60 focus:outline-none focus:border-blue-400/60">
            <option value="all">状態: すべて</option>
            <option value="登録済">登録済</option>
            <option value="申請中">申請中</option>
            <option value="未登録">未登録</option>
            <option value="保留">保留</option>
          </select>
          <SecondaryButton onClick={() => { setKeyword(""); setStatusFilter("all"); }}>クリア</SecondaryButton>
          <SecondaryButton onClick={() => toast.show("一括RSL登録申請を送信しました", "info")}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" />未登録を一括申請</span>
          </SecondaryButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/40 bg-white/40 text-xs text-gray-500">
          {filtered.length} 件 / 全 {items.length} 件
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/40 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">OMS商品コード</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">商品名</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">→</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">RSL SKU</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">RSL商品名</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">UPC/JAN</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録日</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-white/30 hover:bg-white/40">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{m.omsCode}</td>
                <td className="px-3 py-2.5 font-medium text-gray-800">{m.omsName}</td>
                <td className="px-3 py-2.5 text-center text-gray-400"><ArrowRight className="h-3.5 w-3.5 inline" /></td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{m.rslSku}</td>
                <td className="px-3 py-2.5 text-gray-700 text-xs">{m.rslName}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{m.upc}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sb[m.status])}>{m.status}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{m.registeredAt}</td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => { setItems((p) => p.filter((x) => x.id !== m.id)); toast.show("マッピングを削除しました", "info"); }} className="p-1.5 rounded-lg bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
