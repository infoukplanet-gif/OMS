"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { userStore, type UserRecord } from "@/lib/stores/user";
import { User, Shield, Store, Mail as MailIcon, Bell } from "lucide-react";

const shopOptions = [
  "楽天市場 サンプルショップ",
  "Amazon 公式ストア",
  "Shopify 自社EC",
  "Yahoo!ショッピング店",
  "卸売チャネル",
];

const Field = ({
  label,
  required,
  placeholder,
  className,
  type = "text",
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    {onChange !== undefined ? (
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    )}
  </div>
);

const SelectField = ({
  label,
  required,
  options,
  className,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: string[];
  className?: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

interface UserFormProps {
  mode: "create" | "edit";
  recordId?: string;
}

export function UserForm({ mode, recordId }: UserFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const toast = useToast();

  const existing = recordId ? userStore.findById(recordId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [role, setRole] = useState<UserRecord["role"]>(existing?.role ?? "メンバー");
  const [group, setGroup] = useState(existing?.group ?? "CS担当");
  const [selectedShops, setSelectedShops] = useState<string[]>(
    shopOptions.slice(0, existing?.shops ?? shopOptions.length),
  );

  const toggleShop = (s: string) => {
    setSelectedShops((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  function validate(): string | null {
    if (!name.trim()) return "担当者名は必須です";
    if (!email.trim()) return "メールアドレスは必須です";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "メールアドレスの形式が正しくありません";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      toast.show(err, "error");
      return;
    }
    const record: UserRecord = {
      id: existing?.id ?? `U${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      group,
      dept: existing?.dept ?? "—",
      shops: selectedShops.length,
      lastLogin: existing?.lastLogin ?? "—",
      active: existing?.active ?? true,
      invited: !isEdit,
    };
    userStore.upsert(record);
    toast.show(isEdit ? "担当者情報を更新しました" : "担当者を登録しました", "success");
    router.push("/settings/users");
  }

  function handleDisable() {
    if (!recordId) return;
    if (!window.confirm("この担当者を無効化しますか？")) return;
    const rec = userStore.findById(recordId);
    if (rec) {
      userStore.upsert({ ...rec, active: false });
    }
    toast.show("担当者を無効化しました", "info");
    router.push("/settings/users");
  }

  function handleCancel() {
    router.push("/settings/users");
  }

  const ActionButtons = (
    <div className="flex gap-2">
      {isEdit && (
        <button
          onClick={handleDisable}
          className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25"
        >
          無効化
        </button>
      )}
      <button
        onClick={handleCancel}
        className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
      >
        キャンセル
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
      >
        {isEdit ? "更新" : "招待メールを送信"}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? "担当者編集" : "担当者招待・登録"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? "担当者情報・権限を編集します。"
              : "新しい担当者を招待し、権限グループと担当店舗を割り当てます。"}
          </p>
        </div>
        {ActionButtons}
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          設定 &gt; 担当者・権限 &gt;{" "}
          <span className="text-blue-600">{existing?.name ?? "（不明）"}</span> &gt; 編集
        </div>
      )}

      {/* 基本情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />基本情報
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Field
            label="担当者名"
            required
            placeholder="大野 勇樹"
            value={name}
            onChange={setName}
          />
          <Field label="担当者名カナ" placeholder="オオノ ユウキ" />
          <Field label="表示名（ニックネーム）" placeholder="ユウキ" />
          <Field
            label="メールアドレス"
            required
            placeholder="user@example.com"
            type="email"
            className="col-span-2"
            value={email}
            onChange={setEmail}
          />
          <Field label="電話番号" placeholder="090-0000-0000" type="tel" />
          <Field label="部署名" placeholder="営業部" defaultValue={existing?.dept} />
          <Field label="役職" placeholder="部長" />
          <Field label="社員番号" placeholder="EMP-001" />
        </div>
      </GlassCard>

      {/* 権限設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />権限設定
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="ロール"
              required
              options={["オーナー", "管理者", "メンバー"]}
              value={role}
              onChange={(v) => setRole(v as UserRecord["role"])}
            />
            <SelectField
              label="権限グループ"
              required
              options={["管理者", "経営者", "倉庫スタッフ", "CS担当", "経理担当"]}
              value={group}
              onChange={setGroup}
            />
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-gray-700">
              <span className="font-medium text-blue-700">権限グループについて</span>: 選択した権限グループで設定されたメニューへのアクセス権がこの担当者に適用されます。
              権限グループは{" "}
              <a href="/settings/permissions" className="text-blue-600 underline">
                権限グループ設定
              </a>{" "}
              から編集できます。
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 担当店舗 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Store className="h-4 w-4 text-gray-400" />担当店舗
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          この担当者が閲覧・操作できる店舗を選択してください。
        </p>
        <div className="grid grid-cols-2 gap-2">
          {shopOptions.map((s) => (
            <label
              key={s}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors",
                selectedShops.includes(s)
                  ? "bg-blue-500/10 border border-blue-500/30"
                  : "bg-white/40 border border-white/50 hover:bg-white/60",
              )}
            >
              <input
                type="checkbox"
                checked={selectedShops.includes(s)}
                onChange={() => toggleShop(s)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{s}</span>
            </label>
          ))}
        </div>
      </GlassCard>

      {/* 通知・セキュリティ */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-400" />通知・セキュリティ
        </h2>
        <div className="space-y-2">
          {[
            { name: "メール通知（新規受注）", defaultChecked: true },
            { name: "メール通知（出荷完了）", defaultChecked: false },
            { name: "メール通知（低在庫アラート）", defaultChecked: true },
            { name: "IPアドレス制限を有効化", defaultChecked: false },
            { name: "2要素認証を要求", defaultChecked: false },
          ].map((n) => (
            <label
              key={n.name}
              className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 cursor-pointer"
            >
              <span className="text-sm text-gray-700">{n.name}</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={n.defaultChecked}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </div>
            </label>
          ))}
        </div>
      </GlassCard>

      {/* 招待メール（新規時のみ） */}
      {!isEdit && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MailIcon className="h-4 w-4 text-gray-400" />招待メール
          </h2>
          <div className="space-y-3">
            <Field
              label="招待メッセージ（任意）"
              placeholder="ようこそOMSへ。以下のリンクからアカウントを有効化してください。"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>招待リンクの有効期限:</span>
              <select className="h-7 px-2 rounded-lg text-xs bg-white/50 border border-white/50">
                <option>24時間</option>
                <option>3日間</option>
                <option>7日間</option>
                <option>30日間</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && (
          <button
            onClick={handleDisable}
            className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25"
          >
            無効化
          </button>
        )}
        <button
          onClick={handleCancel}
          className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90"
        >
          {isEdit ? "更新" : "招待メールを送信"}
        </button>
      </div>
    </div>
  );
}
