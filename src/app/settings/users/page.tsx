"use client";
import Link from "next/link";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Search, Mail, Shield } from "lucide-react";

const users = [
  { id: "U001", name: "大野 勇樹", email: "ohno@example.com", role: "オーナー", group: "管理者", dept: "経営", shops: 5, lastLogin: "2026/04/13 18:00", active: true, invited: false },
  { id: "U002", name: "田中 明", email: "tanaka@example.com", role: "管理者", group: "倉庫スタッフ", dept: "物流部", shops: 3, lastLogin: "2026/04/13 17:30", active: true, invited: false },
  { id: "U003", name: "佐藤 花子", email: "sato@example.com", role: "メンバー", group: "CS担当", dept: "CS部", shops: 5, lastLogin: "2026/04/13 16:00", active: true, invited: false },
  { id: "U004", name: "鈴木 直子", email: "suzuki@example.com", role: "メンバー", group: "経理担当", dept: "経理部", shops: 5, lastLogin: "2026/04/11 12:00", active: false, invited: false },
  { id: "U005", name: "山田 太郎", email: "yamada@example.com", role: "メンバー", group: "倉庫スタッフ", dept: "物流部", shops: 1, lastLogin: "—", active: true, invited: true },
];

const roleBadge: Record<string, string> = {
  "オーナー": "bg-purple-500/15 text-purple-700",
  "管理者": "bg-blue-500/15 text-blue-700",
  "メンバー": "bg-gray-500/15 text-gray-600",
};

const tabs = [
  { label: "全て", value: "all", count: users.length },
  { label: "アクティブ", value: "active", count: users.filter(u => u.active && !u.invited).length },
  { label: "招待中", value: "invited", count: users.filter(u => u.invited).length },
  { label: "無効", value: "disabled", count: users.filter(u => !u.active).length },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = users.filter((u) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return u.active && !u.invited;
    if (activeTab === "invited") return u.invited;
    if (activeTab === "disabled") return !u.active;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">担当者・権限設定</h1>
          <p className="text-sm text-gray-500 mt-1">担当者の招待・編集・権限グループ割当・担当店舗設定を行います。</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/permissions" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
            <Shield className="h-4 w-4" />権限グループ設定
          </Link>
          <Link href="/settings/users/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
            <Plus className="h-4 w-4" />担当者を招待
          </Link>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all",
              activeTab === t.value
                ? "bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.06)] text-gray-800 font-medium"
                : "text-gray-500 hover:bg-white/40"
            )}
          >
            {t.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              activeTab === t.value ? "bg-blue-500/15 text-blue-700 font-medium" : "bg-gray-500/10 text-gray-500"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* 検索 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="名前・メールで検索..."
          className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* テーブル */}
      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/50 border-b border-white/40">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">名前</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">メール</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">部署</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">ロール</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">権限グループ</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">担当店舗</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">最終ログイン</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500">状態</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {u.name[0]}
                    </div>
                    <span className="font-medium text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{u.email}</td>
                <td className="px-3 py-2.5 text-gray-600 text-xs">{u.dept}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", roleBadge[u.role])}>{u.role}</span>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700 text-xs">{u.group}</td>
                <td className="px-3 py-2.5 text-center text-gray-600 text-xs">{u.shops}店舗</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{u.lastLogin}</td>
                <td className="px-3 py-2.5 text-center">
                  {u.invited ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-700">
                      <Mail className="h-3 w-3" />招待中
                    </span>
                  ) : u.active ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">アクティブ</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/15 text-gray-600">無効</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/settings/users/${u.id}/edit`} className="inline-flex p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors" title="編集">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
