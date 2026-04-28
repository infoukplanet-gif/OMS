"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast, PrimaryButton } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Search, Truck, ListChecks, RotateCcw, X } from "lucide-react";

type Row = {
  id: string;
  order: string;
  customer: string;
  carrier: string;
  warehouse: string;
  amount: number;
  pieces: number;
  ready: boolean;
  block: string | null;
  selected: boolean;
};

const INITIAL: Row[] = [
  { id: "1", order: "ORD-2026-00851", customer: "山田太郎", carrier: "ヤマト運輸", warehouse: "東京本社倉庫", amount: 32400, pieces: 1, ready: true, block: null, selected: false },
  { id: "2", order: "ORD-2026-00850", customer: "佐藤花子", carrier: "ヤマト運輸", warehouse: "東京本社倉庫", amount: 8900, pieces: 1, ready: true, block: null, selected: false },
  { id: "3", order: "ORD-2026-00849", customer: "田中一郎", carrier: "佐川急便", warehouse: "大阪倉庫", amount: 154000, pieces: 2, ready: false, block: "在庫不足（A1-001 が 2 個不足）", selected: false },
  { id: "4", order: "ORD-2026-00848", customer: "鈴木美咲", carrier: "日本郵便", warehouse: "東京本社倉庫", amount: 5600, pieces: 1, ready: true, block: null, selected: false },
  { id: "5", order: "ORD-2026-00847", customer: "高橋健", carrier: "ヤマト運輸", warehouse: "九州物流センター", amount: 22800, pieces: 1, ready: true, block: null, selected: false },
  { id: "6", order: "ORD-2026-00846", customer: "渡辺京子", carrier: "佐川急便", warehouse: "東京本社倉庫", amount: 67800, pieces: 3, ready: false, block: "代引金額未確定", selected: false },
  { id: "7", order: "ORD-2026-00845", customer: "伊藤大輔", carrier: "ヤマト運輸", warehouse: "東京本社倉庫", amount: 22400, pieces: 1, ready: true, block: null, selected: false },
];

const fmt = (n: number) => `¥${n.toLocaleString()}`;

export default function ShipmentsConfirmPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [keyword, setKeyword] = useState("");
  const [readyOnly, setReadyOnly] = useState(true);
  const [warehouse, setWarehouse] = useState("すべて");
  const [carrier, setCarrier] = useState("すべて");

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return rows.filter((r) => {
      if (k && !r.order.toLowerCase().includes(k) && !r.customer.toLowerCase().includes(k)) return false;
      if (readyOnly && !r.ready) return false;
      if (warehouse !== "すべて" && r.warehouse !== warehouse) return false;
      if (carrier !== "すべて" && r.carrier !== carrier) return false;
      return true;
    });
  }, [rows, keyword, readyOnly, warehouse, carrier]);

  const selectedCount = rows.filter((r) => r.selected).length;
  const totalReady = rows.filter((r) => r.ready).length;
  const totalBlocked = rows.filter((r) => !r.ready).length;
  const selectedAmount = rows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);

  const toggleAll = (checked: boolean) =>
    setRows(rows.map((r) => (filtered.find((f) => f.id === r.id) && r.ready ? { ...r, selected: checked } : r)));
  const toggleOne = (id: string) =>
    setRows(rows.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));

  const confirm = () => {
    toast.show(`${selectedCount} 件の出荷確定を実行しました`, "success");
    setRows(rows.map((r) => (r.selected ? { ...r, selected: false } : r)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">出荷確定処理</h1>
            <HelpHint>
              出荷指示済みの受注をまとめて確定し、追跡番号取得・モール通知・売上計上を一括で進めます。{"\n"}
              在庫不足や金額未確定など、確定をブロックする要因がある受注は対象外です。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            出荷可能な受注: <span className="font-semibold text-emerald-700">{totalReady}件</span> ／ ブロック中:{" "}
            <span className="font-semibold text-amber-700">{totalBlocked}件</span>
          </p>
        </div>
        <PrimaryButton onClick={confirm} disabled={selectedCount === 0}>
          <CheckCircle2 className="h-4 w-4" />
          {selectedCount > 0 ? `${selectedCount}件を出荷確定` : "出荷確定する"}
        </PrimaryButton>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><ListChecks className="h-4 w-4" />選択件数</div>
          <p className="mt-2 text-3xl font-bold text-blue-700 tabular-nums">{selectedCount}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><CheckCircle2 className="h-4 w-4" />選択合計金額</div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{fmt(selectedAmount)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Truck className="h-4 w-4" />出荷可能</div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{totalReady}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500"><AlertTriangle className="h-4 w-4" />ブロック中</div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{totalBlocked}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="受注番号・顧客名で検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">倉庫</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "東京本社倉庫", "大阪倉庫", "九州物流センター"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">配送業者</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {["すべて", "ヤマト運輸", "佐川急便", "日本郵便"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={readyOnly}
              onChange={(e) => setReadyOnly(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            出荷可能のみ表示
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((r) => r.selected)}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="accent-blue-500 w-4 h-4"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">受注番号</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">配送業者</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">倉庫</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500">金額</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">個口</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">確定可否</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ブロック理由</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-12 text-center text-gray-400">
                  条件に該当する受注がありません。
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-t border-white/30 hover:bg-white/40",
                    r.selected && "bg-blue-500/8",
                    !r.ready && "opacity-70"
                  )}
                >
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={r.selected}
                      disabled={!r.ready}
                      onChange={() => toggleOne(r.id)}
                      className="accent-blue-500 w-4 h-4 disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-blue-600">{r.order}</td>
                  <td className="px-3 py-2.5 text-gray-800">{r.customer}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.carrier}</td>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{r.warehouse}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 text-center text-gray-700 tabular-nums">{r.pieces}</td>
                  <td className="px-3 py-2.5 text-center">
                    {r.ready ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />可
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700">
                        <X className="h-3 w-3" />ブロック
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-amber-700">{r.block ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">出荷確定で実行される処理</h2>
          <HelpHint>確定ボタン押下時に自動実行される処理の一覧。</HelpHint>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "受注ステータスを「出荷済み」に更新",
            "売上計上日を本日付で確定",
            "在庫を引当済 → 出庫済へ更新",
            "モールへの出荷通知データを生成（楽天/Yahoo!/Amazon）",
            "顧客への発送完了メールをキューに投入",
            "倉庫委託先への確定報告をFTP配信",
            "出荷確定ログ（監査用）を記録",
          ].map((s) => (
            <li key={s} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
