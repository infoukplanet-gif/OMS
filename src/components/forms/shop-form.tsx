"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { shopStore, type ShopRecord } from "@/lib/stores/shop";
import { Store, CreditCard, HelpCircle } from "lucide-react";

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

const Select = ({
  label,
  required,
  options,
  className,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  options: string[];
  className?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
    {onChange !== undefined ? (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    ) : (
      <select
        defaultValue={defaultValue}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )}
  </div>
);

interface ShopFormProps {
  mode: "create" | "edit";
  recordId?: string;
}

export function ShopForm({ mode, recordId }: ShopFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"basic" | "payment">("basic");

  const existing = recordId ? shopStore.findById(recordId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [code, setCode] = useState(existing?.code ?? "");
  const [mall, setMall] = useState(existing?.mall ?? "出店モールを選んでください。");

  const MALLS = [
    "出店モールを選んでください。",
    "楽天市場",
    "Amazon",
    "Yahoo!ショッピング",
    "Shopify",
    "BASE",
    "STORES",
    "au PAY マーケット",
    "Qoo10",
    "自社EC",
    "卸売",
    "電話・FAX受注",
    "その他",
  ];

  function validate(): string | null {
    if (!name.trim()) return "店舗名称は必須です";
    if (!code.trim()) return "店舗略記は必須です";
    if (mall === "出店モールを選んでください。") return "出店モールを選択してください";
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      toast.show(err, "error");
      return;
    }
    const now = new Date().toLocaleDateString("ja-JP").replace(/\//g, "/");
    const record: ShopRecord = {
      ...(existing ?? {}),
      id: existing?.id ?? `S${Date.now()}`,
      name: name.trim(),
      code: code.trim(),
      mall,
      color: existing?.color ?? "bg-blue-500",
      status: existing?.status ?? "未設定",
      lastSync: existing?.lastSync ?? "—",
      lastSyncAt: existing?.lastSyncAt ?? "—",
      apiAuthType: existing?.apiAuthType ?? "—",
      monthlySales: existing?.monthlySales ?? 0,
      monthlyOrders: existing?.monthlyOrders ?? 0,
      defaultWarehouse: existing?.defaultWarehouse ?? "—",
      fromAddress: existing?.fromAddress ?? "—",
      notes: existing?.notes ?? `登録日: ${now}`,
    };
    shopStore.upsert(record);
    toast.show(isEdit ? "店舗情報を更新しました" : "店舗を登録しました", "success");
    router.push("/settings/shops");
  }

  function handleDelete() {
    if (!recordId) return;
    if (!window.confirm("この店舗を削除しますか？")) return;
    shopStore.remove(recordId);
    toast.show("店舗を削除しました", "info");
    router.push("/settings/shops");
  }

  function handleCancel() {
    router.push("/settings/shops");
  }

  const ActionButtons = (
    <div className="flex gap-2">
      {isEdit && (
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25"
        >
          削除
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
        {isEdit ? "更新" : "店舗を新規登録"}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "店舗編集" : "店舗設定"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? "店舗情報を編集します。" : "新規店舗の追加ができます。"}
          </p>
        </div>
        {ActionButtons}
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          設定 &gt; 店舗設定 &gt;{" "}
          <span className="text-blue-600">{existing?.name ?? "（不明）"}</span> &gt; 編集
        </div>
      )}

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/40 bg-white/30">
          <h2 className="text-sm font-semibold text-gray-700">
            店舗情報を{isEdit ? "編集" : "新規登録"}
          </h2>
        </div>

        {/* タブナビゲーション */}
        <div className="flex gap-1 px-5 pt-4 border-b border-white/40">
          <button
            onClick={() => setTab("basic")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm transition-all",
              tab === "basic"
                ? "bg-white/80 border border-white/50 border-b-transparent text-blue-600 font-medium -mb-px"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Store className="h-4 w-4" />基本設定
          </button>
          <button
            onClick={() => setTab("payment")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-t-xl text-sm transition-all",
              tab === "payment"
                ? "bg-white/80 border border-white/50 border-b-transparent text-blue-600 font-medium -mb-px"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <CreditCard className="h-4 w-4" />決済情報設定
          </button>
        </div>

        <div className="p-5">
          {/* 基本設定タブ */}
          {tab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="店舗名称"
                  required
                  placeholder="例: 楽天市場 サンプルショップ"
                  className="col-span-2"
                  value={name}
                  onChange={setName}
                />
                <Field
                  label="店舗略記"
                  required
                  placeholder="例: 楽天"
                  value={code}
                  onChange={setCode}
                />
                <Field label="店舗かな" placeholder="さんぷるしょっぷ" defaultValue={existing?.notes} />
                <Field label="備考" placeholder="店舗に関する備考" className="col-span-2" />
                <Field label="取扱商品" placeholder="例: 電子部品、アクセサリー" className="col-span-2" />
                <Select
                  label="出店モール"
                  required
                  options={MALLS}
                  className="col-span-2"
                  value={mall}
                  onChange={setMall}
                />
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">モール設定</label>
                  <div className="p-3 rounded-xl bg-white/40 text-xs text-gray-500">
                    出店モールを選択すると、モール固有の設定項目が表示されます（API キー、店舗ID など）
                  </div>
                </div>
                <label className="col-span-2 flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">ヒット商品お知らせ対象店舗</span>
                </label>
                <label className="col-span-2 flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">インボイス形式を適用</span>
                  <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <Select
                  label="規定の発送方法"
                  required
                  options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運", "ゆうパケット", "メール便"]}
                  className="col-span-2"
                />
                <Select label="税区分" required options={["税込", "税抜"]} />
                <Select label="税計算順序" required options={["商品計で税計算", "単価から税計算"]} />
                <Select label="通貨単位区分" required options={["円", "USD", "EUR", "CNY"]} />
              </div>
            </div>
          )}

          {/* 決済情報設定タブ */}
          {tab === "payment" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">この店舗で利用する決済方法を設定します。</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "クレジットカード",
                  "銀行振込",
                  "代金引換",
                  "コンビニ決済",
                  "後払い決済",
                  "Amazon Pay",
                  "楽天ペイ",
                  "PayPay",
                  "Apple Pay / Google Pay",
                  "請求書払い（卸用）",
                ].map((m) => (
                  <label
                    key={m}
                    className="flex items-center gap-2 p-3 rounded-xl bg-white/40 hover:bg-white/60 cursor-pointer transition-colors"
                  >
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{m}</span>
                  </label>
                ))}
              </div>
              <div className="pt-3 border-t border-white/40 space-y-3">
                <p className="text-sm font-medium text-gray-700">手数料設定</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="代引手数料" type="number" placeholder="330" />
                  <Field label="銀行振込手数料" type="number" placeholder="0" />
                  <Field label="後払い手数料" type="number" placeholder="200" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/40 bg-white/30 flex justify-end gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25"
            >
              削除
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
            {isEdit ? "更新" : "店舗を新規登録"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
