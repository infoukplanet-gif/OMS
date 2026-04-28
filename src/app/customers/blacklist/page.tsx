"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  ShieldAlert,
  Ban,
  Clock,
  History,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Truck,
  Phone,
  ShoppingCart,
} from "lucide-react";

type Reason =
  | "代金未払い"
  | "受取拒否"
  | "不正カード"
  | "なりすまし"
  | "悪質クレーム"
  | "脅迫・暴言"
  | "規約違反"
  | "その他";

type BlockTarget = "order" | "shipping" | "contact" | "payment";

type Severity = "観察" | "注意" | "警告" | "完全ブロック";

type BlacklistEntry = {
  id: string;
  code: string;
  name: string;
  kana: string;
  email: string;
  phone: string;
  reason: Reason;
  detail: string;
  severity: Severity;
  blocks: BlockTarget[];
  registeredAt: string;
  registeredBy: string;
  expiresAt: string | null;
  status: "active" | "released" | "expired";
  evidenceCount: number;
};

type AuditLog = {
  id: number;
  at: string;
  by: string;
  action: string;
  target: string;
  detail?: string;
};

const ENTRIES: BlacklistEntry[] = [
  {
    id: "BL-001",
    code: "CUS-0099",
    name: "悪質太郎",
    kana: "アクシツタロウ",
    email: "akushitsu@example.com",
    phone: "090-9999-0001",
    reason: "代金未払い",
    detail: "代金引換での受取拒否が3回連続。配送料が累計¥4,800の損害。",
    severity: "完全ブロック",
    blocks: ["order", "shipping", "payment"],
    registeredAt: "2026-03-15",
    registeredBy: "佐藤 健（管理者）",
    expiresAt: null,
    status: "active",
    evidenceCount: 5,
  },
  {
    id: "BL-002",
    code: "CUS-0145",
    name: "迷惑花子",
    kana: "メイワクハナコ",
    email: "meiwaku@example.com",
    phone: "080-9999-0002",
    reason: "不正カード",
    detail: "他人名義クレジットカード使用の疑い。カード会社からチャージバック発生。",
    severity: "完全ブロック",
    blocks: ["order", "payment"],
    registeredAt: "2026-02-28",
    registeredBy: "鈴木 美咲",
    expiresAt: null,
    status: "active",
    evidenceCount: 3,
  },
  {
    id: "BL-003",
    code: "CUS-0201",
    name: "クレーム一郎",
    kana: "クレームイチロウ",
    email: "claim@example.com",
    phone: "070-9999-0003",
    reason: "脅迫・暴言",
    detail: "電話・メールにおける脅迫的な言動を録音/保存済み。法務確認済。",
    severity: "完全ブロック",
    blocks: ["order", "contact", "shipping"],
    registeredAt: "2026-01-10",
    registeredBy: "田中 花子",
    expiresAt: null,
    status: "active",
    evidenceCount: 8,
  },
  {
    id: "BL-004",
    code: "CUS-0312",
    name: "返品濫用 次郎",
    kana: "ヘンピンランヨウ",
    email: "henpin@example.com",
    phone: "090-9999-0004",
    reason: "規約違反",
    detail: "12ヶ月で返品率82%。利用規約第5条に基づき期限付きブロック。",
    severity: "警告",
    blocks: ["order"],
    registeredAt: "2026-04-05",
    registeredBy: "高橋 翔",
    expiresAt: "2026-10-05",
    status: "active",
    evidenceCount: 2,
  },
  {
    id: "BL-005",
    code: "CUS-0420",
    name: "なりすまし 三郎",
    kana: "ナリスマシ",
    email: "narisumashi@example.com",
    phone: "080-9999-0005",
    reason: "なりすまし",
    detail: "別顧客の住所・電話番号で会員登録。本人確認の結果、第三者であることが判明。",
    severity: "完全ブロック",
    blocks: ["order", "payment", "contact"],
    registeredAt: "2025-11-20",
    registeredBy: "佐藤 健（管理者）",
    expiresAt: null,
    status: "active",
    evidenceCount: 4,
  },
  {
    id: "BL-006",
    code: "CUS-0488",
    name: "観察対象 四郎",
    kana: "カンサツタイショウ",
    email: "kansatu@example.com",
    phone: "090-9999-0006",
    reason: "受取拒否",
    detail: "代金引換の受取拒否が2回。3回目で完全ブロック移行を予定。",
    severity: "注意",
    blocks: [],
    registeredAt: "2026-04-12",
    registeredBy: "鈴木 美咲",
    expiresAt: "2026-07-12",
    status: "active",
    evidenceCount: 1,
  },
  {
    id: "BL-007",
    code: "CUS-0510",
    name: "改心 五郎",
    kana: "カイシンゴロウ",
    email: "kaishin@example.com",
    phone: "070-9999-0007",
    reason: "悪質クレーム",
    detail: "本人より謝罪の連絡があり、社内協議の結果、解除済み。",
    severity: "観察",
    blocks: [],
    registeredAt: "2025-08-15",
    registeredBy: "田中 花子",
    expiresAt: null,
    status: "released",
    evidenceCount: 0,
  },
];

// 集計用の擬似「現在日時」（サンプルデータと噛み合わせるため固定）
const PSEUDO_NOW = new Date("2026-04-28").getTime();
function isExpiringSoon(date: string): boolean {
  return new Date(date).getTime() - PSEUDO_NOW < 30 * 24 * 60 * 60 * 1000;
}

const AUDIT_LOG: AuditLog[] = [
  { id: 1, at: "2026-04-25 11:24", by: "佐藤 健", action: "登録", target: "BL-006 観察対象 四郎", detail: "受取拒否2回・注意レベル" },
  { id: 2, at: "2026-04-22 14:08", by: "鈴木 美咲", action: "重要度更新", target: "BL-004 返品濫用 次郎", detail: "観察 → 警告" },
  { id: 3, at: "2026-04-20 09:52", by: "田中 花子", action: "解除", target: "BL-007 改心 五郎", detail: "本人謝罪により解除" },
  { id: 4, at: "2026-04-18 17:43", by: "高橋 翔", action: "登録", target: "BL-004 返品濫用 次郎", detail: "返品率異常検出（自動）" },
  { id: 5, at: "2026-04-15 10:20", by: "システム", action: "ブロック発動", target: "受注 ORD-2026-04812", detail: "BL-001 該当のため自動ホールド" },
  { id: 6, at: "2026-04-10 13:55", by: "佐藤 健", action: "証拠追加", target: "BL-003 クレーム一郎", detail: "通話録音ファイル添付" },
];

const REASON_OPTIONS = ["すべて", "代金未払い", "受取拒否", "不正カード", "なりすまし", "悪質クレーム", "脅迫・暴言", "規約違反", "その他"] as const;
const SEVERITY_OPTIONS = ["すべて", "観察", "注意", "警告", "完全ブロック"] as const;
const STATUS_OPTIONS = ["有効", "全て", "解除済み"] as const;

const BLOCK_LABEL: Record<BlockTarget, string> = {
  order: "受注ブロック",
  shipping: "配送ブロック",
  contact: "連絡ブロック",
  payment: "決済ブロック",
};

const BLOCK_ICON: Record<BlockTarget, typeof ShoppingCart> = {
  order: ShoppingCart,
  shipping: Truck,
  contact: Phone,
  payment: CreditCard,
};

export default function BlacklistPage() {
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [reason, setReason] = useState<(typeof REASON_OPTIONS)[number]>("すべて");
  const [severity, setSeverity] = useState<(typeof SEVERITY_OPTIONS)[number]>("すべて");
  const [statusTab, setStatusTab] = useState<(typeof STATUS_OPTIONS)[number]>("有効");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<BlacklistEntry | null>(null);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    return ENTRIES.filter((e) => {
      if (statusTab === "有効" && e.status !== "active") return false;
      if (statusTab === "解除済み" && e.status === "active") return false;
      if (
        k &&
        !e.name.toLowerCase().includes(k) &&
        !e.kana.toLowerCase().includes(k) &&
        !e.code.toLowerCase().includes(k) &&
        !e.email.toLowerCase().includes(k)
      )
        return false;
      if (reason !== "すべて" && e.reason !== reason) return false;
      if (severity !== "すべて" && e.severity !== severity) return false;
      return true;
    });
  }, [keyword, reason, severity, statusTab]);

  const totals = {
    active: ENTRIES.filter((e) => e.status === "active").length,
    fullyBlocked: ENTRIES.filter((e) => e.status === "active" && e.severity === "完全ブロック").length,
    expiringSoon: ENTRIES.filter((e) => e.status === "active" && e.expiresAt && isExpiringSoon(e.expiresAt))
      .length,
    released: ENTRIES.filter((e) => e.status === "released").length,
  };

  const release = (entry: BlacklistEntry) => {
    toast.show(`${entry.name} さんのブラックリスト登録を解除しました`, "success");
    setSelected(null);
  };

  const escalate = (entry: BlacklistEntry) => {
    toast.show(`${entry.name} さんの重要度を引き上げました（要保存）`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">ブラックリスト管理</h1>
            <HelpHint>
              悪質顧客・トラブル顧客を登録し、新規受注・配送・連絡を自動ブロックします。{"\n"}
              証拠保全と監査ログにより、後日の説明責任にも対応します。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            重要度・ブロック範囲・期限を細かく管理できます。受注取込時に自動チェックされます。
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
            <Download className="h-4 w-4" />監査ログをエクスポート
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
          >
            <Plus className="h-4 w-4" />新規登録
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShieldAlert className="h-4 w-4" />有効な登録
          </div>
          <p className="mt-2 text-3xl font-bold text-red-700 tabular-nums">{totals.active}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Ban className="h-4 w-4" />完全ブロック
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{totals.fullyBlocked}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />30日以内に期限切れ
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-700 tabular-nums">{totals.expiringSoon}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4" />解除済み
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{totals.released}</p>
        </GlassCard>
      </div>

      {/* タブ + フィルター */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 border border-white/50 w-fit">
        {STATUS_OPTIONS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={cn(
              "px-3 py-2 rounded-xl text-sm transition-all",
              statusTab === tab
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <label className="text-xs text-gray-500">キーワード</label>
            <Search className="absolute left-3 top-[26px] h-4 w-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder="氏名・カナ・コード・メールで検索"
              className="mt-1 w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">登録理由</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof REASON_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {REASON_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">重要度</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as (typeof SEVERITY_OPTIONS)[number])}
              className="mt-1 h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* 一覧 + 詳細 */}
      <div className="flex gap-4">
        <GlassCard className={cn("p-0 overflow-hidden", selected ? "flex-1" : "w-full")}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50 border-b border-white/40">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">顧客</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録理由</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">重要度</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">ブロック範囲</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">登録日</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">期限</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-gray-400">
                      条件に該当する登録はありません。
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={cn(
                        "border-t border-white/30 cursor-pointer transition-colors",
                        selected?.id === e.id ? "bg-red-500/10" : "hover:bg-white/40",
                        e.status === "released" && "opacity-60"
                      )}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{e.id}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800">{e.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{e.code}</p>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{e.reason}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            e.severity === "完全ブロック" && "bg-red-500/15 text-red-700",
                            e.severity === "警告" && "bg-orange-500/15 text-orange-700",
                            e.severity === "注意" && "bg-amber-500/15 text-amber-700",
                            e.severity === "観察" && "bg-blue-500/15 text-blue-700"
                          )}
                        >
                          {e.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          {e.blocks.length === 0 ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            e.blocks.map((b) => {
                              const Icon = BLOCK_ICON[b];
                              return (
                                <span
                                  key={b}
                                  title={BLOCK_LABEL[b]}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-700"
                                >
                                  <Icon className="h-3 w-3" />
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{e.registeredAt}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {e.expiresAt ? (
                          <span className="text-gray-700">{e.expiresAt}</span>
                        ) : (
                          <span className="text-red-600 font-medium">永久</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {e.status === "active" ? (
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              release(e);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-700 hover:bg-red-500/25"
                          >
                            解除
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">解除済み</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* 詳細パネル */}
        {selected && (
          <GlassCard className="w-96 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-mono">{selected.id}</p>
                <h3 className="font-semibold text-gray-800">{selected.name}</h3>
                <p className="text-xs text-gray-500">{selected.kana}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-red-500/10 border border-red-300/40 p-3 text-xs text-red-800">
              <div className="flex items-center gap-1 font-semibold mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />重要度: {selected.severity}
              </div>
              <p>{selected.detail}</p>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="顧客コード" value={selected.code} />
              <Row label="メール" value={selected.email} />
              <Row label="電話" value={selected.phone} />
              <Row label="登録理由" value={selected.reason} />
              <Row label="登録者" value={selected.registeredBy} />
              <Row label="登録日" value={selected.registeredAt} />
              <Row label="有効期限" value={selected.expiresAt ?? "永久"} />
              <Row label="証拠ファイル" value={`${selected.evidenceCount} 件`} />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1.5">ブロック範囲</p>
              <div className="flex flex-wrap gap-1.5">
                {(["order", "payment", "shipping", "contact"] as BlockTarget[]).map((b) => {
                  const Icon = BLOCK_ICON[b];
                  const enabled = selected.blocks.includes(b);
                  return (
                    <span
                      key={b}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs",
                        enabled
                          ? "bg-red-500/15 text-red-700 border border-red-300/40"
                          : "bg-gray-200/40 text-gray-400 border border-white/40"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {BLOCK_LABEL[b]}
                    </span>
                  );
                })}
              </div>
            </div>

            {selected.status === "active" && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => escalate(selected)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm bg-amber-500/15 border border-amber-300/40 text-amber-800 hover:bg-amber-500/25"
                >
                  重要度を上げる
                </button>
                <button
                  onClick={() => release(selected)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm bg-red-500/15 border border-red-300/40 text-red-700 hover:bg-red-500/25"
                >
                  登録を解除
                </button>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {/* 監査ログ */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-800">監査ログ（直近）</h2>
          <HelpHint>
            ブラックリストの登録・解除・自動ブロック発動の履歴。{"\n"}
            社内/法的説明責任を果たすため、操作はすべて記録されます。
          </HelpHint>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/60 text-gray-600 text-xs">
                <th className="text-left py-2 px-2 font-medium">日時</th>
                <th className="text-left py-2 px-2 font-medium">操作者</th>
                <th className="text-left py-2 px-2 font-medium">操作</th>
                <th className="text-left py-2 px-2 font-medium">対象</th>
                <th className="text-left py-2 px-2 font-medium">詳細</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((l) => (
                <tr key={l.id} className="border-b border-white/40 hover:bg-white/40">
                  <td className="py-2 px-2 text-gray-700 text-xs">{l.at}</td>
                  <td className="py-2 px-2 text-gray-700">{l.by}</td>
                  <td className="py-2 px-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        l.action === "登録" && "bg-red-500/15 text-red-700",
                        l.action === "解除" && "bg-emerald-500/15 text-emerald-700",
                        l.action === "重要度更新" && "bg-amber-500/15 text-amber-700",
                        l.action === "ブロック発動" && "bg-orange-500/15 text-orange-700",
                        l.action === "証拠追加" && "bg-blue-500/15 text-blue-700"
                      )}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-700 text-xs">{l.target}</td>
                  <td className="py-2 px-2 text-gray-500 text-xs">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 新規登録モーダル */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">ブラックリスト新規登録</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/60 text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="対象顧客コード" placeholder="CUS-0099" required />
              <ModalField label="顧客名" placeholder="氏名（自動取得）" />
              <ModalField label="登録理由" placeholder="代金未払い" />
              <ModalField label="重要度" placeholder="完全ブロック / 警告 / 注意 / 観察" />
              <ModalField label="ブロック範囲" placeholder="受注 / 配送 / 連絡 / 決済" className="col-span-2" />
              <ModalField label="有効期限" placeholder="無期限 or 日付" />
              <ModalField label="証拠ファイル" placeholder="ドラッグ&ドロップ or 参照" />
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">詳細・証拠の説明</label>
                <textarea
                  rows={4}
                  placeholder="経緯・対応履歴・社内決裁番号など..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  toast.show("ブラックリストに登録しました", "success");
                  setShowAddModal(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/80 border border-red-400/50 text-white hover:bg-red-500/90"
              >
                登録する
              </button>
            </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-700 truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function ModalField({
  label,
  placeholder,
  required,
  className,
}: {
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500 text-xs">*必須</span>}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}
