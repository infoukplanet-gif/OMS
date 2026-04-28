"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  Ban,
  CreditCard,
  Truck,
  ArrowRight,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  History,
} from "lucide-react";

type CategoryCard = {
  href: string;
  icon: typeof Ban;
  title: string;
  desc: string;
  accent: string;
  total: number;
  active: number;
  unused: number;
  thisMonthUse: number;
  hint: string;
};

const CARDS: CategoryCard[] = [
  {
    href: "/orders/categories/cancel",
    icon: Ban,
    title: "キャンセル区分",
    desc: "受注キャンセル理由をマスタとして管理します。",
    accent: "text-red-600 bg-red-500/10 border-red-500/20",
    total: 12,
    active: 10,
    unused: 2,
    thisMonthUse: 84,
    hint: "顧客都合・在庫不足・与信NGなど、キャンセル発生時に選択する理由マスタ。理由ごとの集計レポートにも使用されます。",
  },
  {
    href: "/orders/categories/payment",
    icon: CreditCard,
    title: "支払区分",
    desc: "支払方法・手数料・前払/後払の区分を管理します。",
    accent: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    total: 14,
    active: 12,
    unused: 2,
    thisMonthUse: 1284,
    hint: "クレジットカード・代金引換・銀行振込・コンビニ払いなど。手数料率と消込タイミングを区分ごとに設定します。",
  },
  {
    href: "/orders/categories/shipping",
    icon: Truck,
    title: "発送区分",
    desc: "発送方法・送料・リード日数・代引対応を管理します。",
    accent: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    total: 9,
    active: 8,
    unused: 1,
    thisMonthUse: 1248,
    hint: "ヤマト・佐川・日本郵便・西濃・福山などの配送方法。送料テーブル・リード日数・代引対応をここで管理します。",
  },
];

const RECENT_CHANGES = [
  { id: 1, at: "2026-04-25 14:32", who: "佐藤 健", category: "支払区分", action: "追加", target: "Amazon Pay" },
  { id: 2, at: "2026-04-23 09:18", who: "鈴木 美咲", category: "発送区分", action: "更新", target: "ヤマト宅急便（送料改定）" },
  { id: 3, at: "2026-04-21 16:45", who: "田中 花子", category: "キャンセル区分", action: "追加", target: "代引受取拒否" },
  { id: 4, at: "2026-04-18 11:08", who: "高橋 翔", category: "発送区分", action: "無効化", target: "西濃カンガルー便" },
  { id: 5, at: "2026-04-15 13:22", who: "佐藤 健", category: "支払区分", action: "更新", target: "クレジット手数料率改定" },
];

const HEALTH_CHECKS = [
  { id: 1, severity: "ok" as const, label: "支払区分すべてに手数料が設定されています" },
  { id: 2, severity: "warning" as const, label: "発送区分「西濃カンガルー便」が30日間未使用です" },
  { id: 3, severity: "warning" as const, label: "キャンセル区分「その他」の使用比率が42%と高すぎます（要細分化）" },
  { id: 4, severity: "ok" as const, label: "全モール連携の区分マッピングが完了しています" },
];

export default function CategoriesHubPage() {
  const totalDefs = CARDS.reduce((s, c) => s + c.total, 0);
  const totalUnused = CARDS.reduce((s, c) => s + c.unused, 0);
  const totalUse = CARDS.reduce((s, c) => s + c.thisMonthUse, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">区分名称設定</h1>
            <HelpHint>
              受注で使う3種類の区分マスタ（キャンセル・支払・発送）を一括で管理する画面です。{"\n"}
              各カードから個別の編集画面に進めます。
            </HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            受注で使う3種類の区分（キャンセル・支払・発送）の名称と属性を設定します。マスタ整合性のヘルスチェックもこの画面で確認できます。
          </p>
        </div>
        <Link
          href="/settings/master-delete"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
        >
          マスタ削除メニューへ
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* サマリーKPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Layers className="h-4 w-4" />総区分数
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800 tabular-nums">{totalDefs}</p>
          <p className="text-xs text-gray-500">3カテゴリの合計</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />今月の利用件数
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-700 tabular-nums">{totalUse.toLocaleString()}</p>
          <p className="text-xs text-gray-500">受注に紐付いた区分の合計</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="h-4 w-4" />未使用区分
          </div>
          <p
            className={cn(
              "mt-2 text-3xl font-bold tabular-nums",
              totalUnused > 0 ? "text-amber-700" : "text-gray-800"
            )}
          >
            {totalUnused}
          </p>
          <p className="text-xs text-gray-500">直近90日で未使用</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <History className="h-4 w-4" />最終更新
          </div>
          <p className="mt-2 text-base font-semibold text-gray-800">2026-04-25</p>
          <p className="text-xs text-gray-500">支払区分に Amazon Pay 追加</p>
        </GlassCard>
      </div>

      {/* 各カテゴリのカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="block group">
            <GlassCard className="h-full transition-all group-hover:bg-white/85 group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border", c.accent)}>
                  <c.icon className="h-5 w-5" />
                </div>
                <HelpHint side="left">{c.hint}</HelpHint>
              </div>
              <h2 className="text-base font-semibold text-gray-800">{c.title}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.desc}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/50">
                  <p className="text-[10px] text-gray-500">登録数</p>
                  <p className="text-lg font-bold text-gray-800 tabular-nums">{c.total}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/50">
                  <p className="text-[10px] text-gray-500">有効</p>
                  <p className="text-lg font-bold text-emerald-700 tabular-nums">{c.active}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/50">
                  <p className="text-[10px] text-gray-500">未使用</p>
                  <p
                    className={cn(
                      "text-lg font-bold tabular-nums",
                      c.unused > 0 ? "text-amber-700" : "text-gray-400"
                    )}
                  >
                    {c.unused}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/40 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  今月利用: <span className="font-semibold text-gray-800 tabular-nums">{c.thisMonthUse.toLocaleString()}</span> 件
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                  開く <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* ヘルスチェック + 変更履歴 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-gray-800">マスタ整合性ヘルスチェック</h2>
            <HelpHint>
              区分マスタの運用に支障がないかを自動診断した結果。{"\n"}
              「未使用区分」は無効化または削除を、「使用比率の偏り」は細分化を検討してください。
            </HelpHint>
          </div>
          <div className="space-y-2">
            {HEALTH_CHECKS.map((h) => (
              <div
                key={h.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  h.severity === "ok" && "bg-emerald-500/8 border-emerald-300/40",
                  h.severity === "warning" && "bg-amber-500/8 border-amber-300/40"
                )}
              >
                {h.severity === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span className="text-sm text-gray-700">{h.label}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-800">直近の変更履歴</h2>
            <HelpHint>区分マスタの追加・更新・無効化のログ。誰がいつ何を変えたかを追跡できます。</HelpHint>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">日時</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作者</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">カテゴリ</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">操作</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">対象</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_CHANGES.map((c) => (
                  <tr key={c.id} className="border-t border-white/40 hover:bg-white/40 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-gray-500 tabular-nums">{c.at}</td>
                    <td className="px-3 py-2.5 text-gray-700">{c.who}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{c.category}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          c.action === "追加" && "bg-emerald-500/15 text-emerald-700",
                          c.action === "更新" && "bg-blue-500/15 text-blue-700",
                          c.action === "無効化" && "bg-amber-500/15 text-amber-700"
                        )}
                      >
                        {c.action}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{c.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
