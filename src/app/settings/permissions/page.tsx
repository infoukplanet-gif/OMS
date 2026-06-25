"use client";
import { useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  Plus, Shield, Users, ShoppingCart, Truck, Tag, Box,
  ClipboardList, BarChart3, Settings, Mail, Printer, Edit, X, Check,
} from "lucide-react";
import { usePersistentStore } from "@/lib/hooks/use-persistent-store";
import {
  permissionGroupsStore,
  INITIAL_PERMISSION_GROUPS,
  type PermissionGroup,
} from "@/lib/stores/permission-groups-store";

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
  const toast = useToast();
  usePersistentStore({ store: permissionGroupsStore, domain: "permission-groups", seed: INITIAL_PERMISSION_GROUPS });
  const groups = useSyncExternalStore(
    permissionGroupsStore.subscribe,
    permissionGroupsStore.getState,
    permissionGroupsStore.getState,
  ) as readonly PermissionGroup[];
  const [selectedGroup, setSelectedGroup] = useState("G003");
  const [restrictedItems, setRestrictedItems] = useState<Record<string, boolean>>(() => {
    const g = INITIAL_PERMISSION_GROUPS.find((x) => x.id === "G003");
    return g?.restricted ?? {};
  });

  // グループ名編集モード
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // 新規グループ追加モード
  const [addingGroup, setAddingGroup] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const currentGroup = groups.find((g) => g.id === selectedGroup);

  const selectGroup = (id: string) => {
    setSelectedGroup(id);
    const g = groups.find((x) => x.id === id);
    setRestrictedItems(g?.restricted ?? {});
    setEditingName(false);
  };

  const toggleItem = (key: string) => {
    setRestrictedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!currentGroup) return;
    permissionGroupsStore.upsert({ ...currentGroup, restricted: { ...restrictedItems } });
    toast.show(`「${currentGroup.name}」の権限を保存しました`, "success");
  };

  const handleReset = () => {
    const original = groups.find((x) => x.id === selectedGroup);
    setRestrictedItems(original?.restricted ?? {});
    toast.show("変更を元に戻しました", "info");
  };

  const handleStartEditName = () => {
    setEditName(currentGroup?.name ?? "");
    setEditDesc(currentGroup?.desc ?? "");
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (!editName.trim()) {
      toast.show("グループ名は必須です", "error");
      return;
    }
    if (!currentGroup) return;
    permissionGroupsStore.upsert({ ...currentGroup, name: editName.trim(), desc: editDesc.trim() });
    setEditingName(false);
    toast.show("グループ情報を更新しました", "success");
  };

  const handleAddGroup = () => {
    if (!newName.trim()) {
      toast.show("グループ名は必須です", "error");
      return;
    }
    const id = `G${String(Date.now()).slice(-4)}`;
    permissionGroupsStore.upsert({ id, name: newName.trim(), desc: newDesc.trim() || "新規権限グループ", users: 0, isAdmin: false, restricted: {} });
    setNewName("");
    setNewDesc("");
    setAddingGroup(false);
    selectGroup(id);
    toast.show(`「${newName.trim()}」を追加しました`, "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">権限グループ設定</h1>
          <p className="text-sm text-gray-500 mt-1">担当者ごとにアクセス可能なメニューを制御します。</p>
        </div>
        <button
          onClick={() => setAddingGroup(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all"
        >
          <Plus className="h-4 w-4" />権限グループを追加
        </button>
      </div>

      {/* 新規グループ追加フォーム */}
      {addingGroup && (
        <GlassCard>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">新規権限グループを追加</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">グループ名 <span className="text-red-500">*必須</span></label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 物流マネージャー"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">説明</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="例: 出荷・在庫・発注を担当"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setAddingGroup(false); setNewName(""); setNewDesc(""); }}
              className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
            >
              キャンセル
            </button>
            <button
              onClick={handleAddGroup}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
            >
              追加
            </button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* グループ一覧 */}
        <GlassCard className="col-span-3 p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/40 bg-white/30">
            <h2 className="text-sm font-semibold text-gray-700">権限グループ一覧</h2>
          </div>
          <div className="divide-y divide-white/30">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGroup(g.id)}
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
              <div className="flex-1">
                {editingName ? (
                  <div className="space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 px-3 rounded-xl text-sm font-semibold bg-white/50 border border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                    />
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="h-7 px-3 rounded-xl text-xs bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 ml-2"
                    />
                    <div className="flex gap-1 ml-2">
                      <button onClick={handleSaveName} className="p-1 rounded-lg bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingName(false)} className="p-1 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-800">「{currentGroup?.name}」の権限設定</h2>
                    {!currentGroup?.isAdmin && (
                      <button onClick={handleStartEditName} className="p-1 rounded-lg text-gray-400 hover:bg-white/60 hover:text-blue-600 transition-colors" title="グループ名を編集">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
                {!editingName && (
                  <p className="text-xs text-gray-500 mt-0.5">使用を「許可しない」項目にチェックを入れてください</p>
                )}
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
                {permissionCategories.map((cat) => (
                  <div key={cat.name} className="rounded-xl border border-white/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 border-b border-white/40">
                      <cat.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-2">
                      {cat.items.map((item) => {
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
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
              >
                リセット
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
              >
                権限グループの情報を変更
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
