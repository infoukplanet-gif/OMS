"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Plus, Shield, Users, ShoppingCart, Truck, Tag, Box, ClipboardList, BarChart3, Settings, Mail, Printer } from "lucide-react";

const groups = [
  { id: "G001", name: "管理者", desc: "全機能にアクセス可能", users: 2, isAdmin: true },
  { id: "G002", name: "経営者", desc: "全機能の閲覧 + 分析", users: 1, isAdmin: false },
  { id: "G003", name: "倉庫スタッフ", desc: "出荷・在庫操作", users: 5, isAdmin: false },
  { id: "G004", name: "CS担当", desc: "受注・顧客対応", users: 3, isAdmin: false },
  { id: "G005", name: "経理担当", desc: "入金・請求書発行", users: 2, isAdmin: false },
];

const permissionCategories = [
  {
    icon: Settings, name: "設定メニュー全般", items: [
      "基本", "受注", "商品", "在庫", "仕入", "メール", "印刷", "その他", "アプリ"
    ],
  },
  {
    icon: ShoppingCart, name: "受注メニュー", items: [
      "受注伝票検索", "新規伝票登録", "受注伝票の一括登録",
      "確認待ち（件数）の表示", "入金待ち（件数）の表示", "印刷待ち（件数）の表示"
    ],
  },
  {
    icon: Box, name: "在庫メニュー", items: [
      "在庫一覧", "在庫変動履歴の確認", "セット商品", "棚卸"
    ],
  },
  {
    icon: Tag, name: "商品メニュー", items: [
      "商品管理", "ページ管理"
    ],
  },
  {
    icon: ClipboardList, name: "発注・仕入メニュー", items: [
      "発注伝票検索", "発注計算", "仕入伝票検索", "仕入計上", "買掛残高一覧", "仕入先元帳"
    ],
  },
  {
    icon: BarChart3, name: "分析メニュー全般", items: ["売上分析", "商品分析", "チャネル別分析"],
  },
  {
    icon: Users, name: "顧客管理メニュー全般", items: ["顧客一覧", "卸先マスタ", "ブラックリスト"],
  },
  {
    icon: Truck, name: "出荷メニュー", items: [
      "出荷指示書", "納品書", "検品サポート", "配送番号反映", "出荷確定"
    ],
  },
  {
    icon: Mail, name: "メールメニュー", items: ["送信待ち", "送信履歴", "テンプレート"],
  },
  {
    icon: Printer, name: "日次処理", items: ["バックアップ", "ログ閲覧"],
  },
];

export default function PermissionsPage() {
  const [selectedGroup, setSelectedGroup] = useState("G003");
  const [restrictedItems, setRestrictedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setRestrictedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentGroup = groups.find(g => g.id === selectedGroup);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">権限グループ設定</h1>
          <p className="text-sm text-gray-500 mt-1">担当者ごとにアクセス可能なメニューを制御します。</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
          <Plus className="h-4 w-4" />権限グループを追加
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* グループ一覧 */}
        <GlassCard className="col-span-3 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/40 bg-white/30">
            <h2 className="text-sm font-semibold text-gray-700">権限グループ一覧</h2>
          </div>
          <div className="divide-y divide-white/30">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className={cn(
                  "w-full px-4 py-3 text-left transition-all",
                  selectedGroup === g.id
                    ? "bg-blue-500/10 border-l-4 border-blue-500"
                    : "hover:bg-white/40"
                )}
              >
                <div className="flex items-center gap-2">
                  {g.isAdmin && <Shield className="h-4 w-4 text-purple-600" />}
                  <span className={cn("font-medium text-sm", selectedGroup === g.id ? "text-blue-700" : "text-gray-800")}>{g.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{g.users}名所属</p>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 権限詳細 */}
        <div className="col-span-9 space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-800">「{currentGroup?.name}」の権限設定</h2>
                <p className="text-xs text-gray-500 mt-0.5">使用を「許可しない」項目にチェックを入れてください</p>
              </div>
              {currentGroup?.isAdmin && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-700">管理者ロール（全権限）</span>
              )}
            </div>

            {currentGroup?.isAdmin ? (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-sm text-purple-800">管理者ロールは全ての機能にアクセス可能です（IPアドレス制限などを除く）。個別の権限設定はできません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {permissionCategories.map(cat => (
                  <div key={cat.name} className="rounded-xl border border-white/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 border-b border-white/40">
                      <cat.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {cat.items.map(item => {
                        const key = `${cat.name}-${item}`;
                        const restricted = restrictedItems[key];
                        return (
                          <label key={item} className={cn(
                            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                            restricted ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-white/60"
                          )}>
                            <input
                              type="checkbox"
                              checked={!!restricted}
                              onChange={() => toggleItem(key)}
                              className="rounded border-gray-300"
                            />
                            <span className={cn("text-xs", restricted ? "text-red-700 line-through" : "text-gray-700")}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {!currentGroup?.isAdmin && (
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">リセット</button>
              <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">権限グループの情報を変更</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
