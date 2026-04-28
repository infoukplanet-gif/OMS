"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  User,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Tag,
  CreditCard,
  Bell,
  KeyRound,
  Users,
  TrendingUp,
} from "lucide-react";

const Field = ({
  label,
  required,
  placeholder,
  className,
  type = "text",
  defaultValue,
  hint,
  unit,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
  defaultValue?: string;
  hint?: string;
  unit?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 text-xs">*必須</span>}
      {hint && <HelpHint side="right">{hint}</HelpHint>}
    </label>
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={cn(
          "w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all",
          unit && "pr-10"
        )}
      />
      {unit && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">{unit}</span>
      )}
    </div>
  </div>
);

const Select = ({
  label,
  required,
  options,
  className,
  defaultValue,
  hint,
}: {
  label: string;
  required?: boolean;
  options: string[];
  className?: string;
  defaultValue?: string;
  hint?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 text-xs">*必須</span>}
      {hint && <HelpHint side="right">{hint}</HelpHint>}
    </label>
    <select
      defaultValue={defaultValue}
      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const Toggle = ({
  label,
  defaultChecked,
  hint,
}: {
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) => (
  <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50">
    <span className="flex items-center gap-1.5">
      {label}
      {hint && <HelpHint side="right">{hint}</HelpHint>}
    </span>
    <input type="checkbox" defaultChecked={defaultChecked} className="accent-blue-500 w-4 h-4" />
  </label>
);

const TAG_OPTIONS = [
  "リピーター",
  "VIP候補",
  "ギフト購入多",
  "アレルギー対応",
  "B to B窓口",
  "メディア露出注意",
  "クレーム履歴あり",
  "海外発送可",
];

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: Record<string, unknown>;
}

export function CustomerForm({ mode }: CustomerFormProps) {
  const [shippingAddresses, setShippingAddresses] = useState([1, 2]);
  const [tags, setTags] = useState<string[]>(mode === "edit" ? ["リピーター", "ギフト購入多"] : []);
  const isEdit = mode === "edit";

  const addAddress = () => {
    if (shippingAddresses.length < 5) setShippingAddresses([...shippingAddresses, shippingAddresses.length + 1]);
  };
  const removeAddress = (i: number) => setShippingAddresses(shippingAddresses.filter((n) => n !== i));

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const d = isEdit
    ? {
        code: "CUS-0001",
        name: "山田 太郎",
        kana: "ヤマダ タロウ",
        email: "yamada@example.com",
        tel: "090-1234-5678",
      }
    : ({} as Record<string, string>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "顧客編集" : "顧客登録"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            個人顧客の登録・編集ページ。基本情報・連絡先・与信・タグ・同意設定など、業務に必要な全項目を一画面で管理します。
          </p>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">
              削除
            </button>
          )}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
            キャンセル
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
            {isEdit ? "更新" : "保存"}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          ダッシュボード &gt; 顧客一覧 &gt; <span className="text-blue-600">{d.name}</span> &gt; 編集
        </div>
      )}

      {/* 統計サマリー（編集モードのみ） */}
      {isEdit && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />取引サマリー
            <HelpHint>編集対象顧客の取引実績ハイライトです。詳細は顧客詳細ページから確認できます。</HelpHint>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "購入回数", value: "24", unit: "回" },
              { label: "累計金額", value: "¥384,200" },
              { label: "平均単価", value: "¥16,008" },
              { label: "最終購入", value: "04/11" },
              { label: "問合せ件数", value: "3", unit: "件" },
              { label: "クレーム", value: "0", unit: "件" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-white/50">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-800 tabular-nums">
                  {s.value}
                  {s.unit && <span className="text-sm font-normal ml-1">{s.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 基本情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />基本情報
          <HelpHint>顧客を識別する基本項目。コードは自動採番運用も可能です（システム設定）。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="顧客コード" required placeholder="CUS-0001" defaultValue={d.code} hint="自動採番設定の場合は空欄で保存してください。" />
          <Select label="顧客タイプ" options={["個人", "法人", "団体"]} hint="法人を選ぶと請求書宛名が法人名で出力されます。" />
          <Field label="顧客名（姓 名）" required placeholder="山田 太郎" defaultValue={d.name} />
          <Field label="顧客名カナ" placeholder="ヤマダ タロウ" defaultValue={d.kana} hint="検索性のため必ず入力推奨。半角/全角は自動正規化されます。" />
          <Field label="ニックネーム" placeholder="タロちゃん" />
          <Select label="性別" options={["未設定", "男性", "女性", "その他"]} />
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              生年月日
              <HelpHint side="right">誕生日DM・年齢別レポートに利用します。</HelpHint>
            </label>
            <DatePicker placeholder="生年月日を選択" />
          </div>
          <Select label="国籍" options={["日本", "中国", "韓国", "米国", "その他"]} />
          <Field label="会社名" placeholder="株式会社サンプル" />
          <Field label="部署名" placeholder="営業部" />
          <Field label="役職" placeholder="部長" />
          <Field label="紹介元" placeholder="Webサイト/知人紹介" hint="集客分析に使用するチャネル名。" />
          <Select label="顧客区分" options={["一般", "VIP", "法人", "取引先"]} />
          <Select label="ランク" options={["通常", "シルバー", "ゴールド", "プラチナ"]} hint="購入実績で自動更新されますが、手動上書きも可能です。" />
          <Select label="言語" options={["日本語", "English", "中文（簡体）", "中文（繁体）", "한국어"]} />
          <Select label="担当営業" options={["未割当", "佐藤 健", "鈴木 美咲", "田中 花子", "高橋 翔"]} />
        </div>
      </GlassCard>

      {/* 連絡先 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />連絡先
          <HelpHint>複数の連絡手段を持つ顧客に備え、電話・メールは複数登録できます。</HelpHint>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="電話番号1（主）" placeholder="03-0000-0000" type="tel" defaultValue={d.tel} />
          <Field label="電話番号2" placeholder="090-0000-0000" type="tel" />
          <Field label="電話番号3" placeholder="予備" type="tel" />
          <Field label="FAX" placeholder="03-0000-0000" type="tel" />
          <Field label="メールアドレス1" required placeholder="example@mail.com" type="email" defaultValue={d.email} hint="ログインID・通知配信先になります。" />
          <Field label="メールアドレス2" placeholder="予備" type="email" />
          <Field label="LINE ID" placeholder="@yamada" />
          <Field label="Webサイト" placeholder="https://example.com" />
          <Select label="連絡優先度" options={["メール優先", "電話優先", "LINE優先", "FAX優先"]} hint="どの手段で先に連絡するかの社内ルール。" />
          <Field label="連絡可能時間帯" placeholder="平日 10:00-18:00" />
          <Field label="緊急連絡先" placeholder="奥様: 080-XXXX-XXXX" />
          <Toggle label="SMS送信可" defaultChecked hint="OFFの場合、SMSメッセージは配信対象から除外されます。" />
        </div>
      </GlassCard>

      {/* 請求先住所 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />請求先住所
          <HelpHint>請求書・領収書の宛先住所。送付先と同じ場合も明示的に登録します。</HelpHint>
        </h2>
        <div className="grid grid-cols-6 gap-4">
          <Field label="郵便番号" placeholder="100-0001" className="col-span-1" hint="ハイフン有無どちらでも保存できます。" />
          <Select label="都道府県" options={["選択", "東京都", "大阪府", "北海道", "京都府", "福岡県"]} className="col-span-1" />
          <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
          <Field label="番地" placeholder="千代田1-1-1" className="col-span-2" />
          <Field label="建物名・部屋番号" placeholder="サンプルビル 10F" className="col-span-6" />
        </div>
      </GlassCard>

      {/* 送付先住所 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />送付先住所（{shippingAddresses.length}/5件）
            <HelpHint>勤務先・実家・別荘などの異なる送付先を最大5件まで登録できます。</HelpHint>
          </h2>
          {shippingAddresses.length < 5 && (
            <button
              onClick={addAddress}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />送付先を追加
            </button>
          )}
        </div>
        {shippingAddresses.map((i) => (
          <GlassCard key={i}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">送付先 {i}</h3>
              <button
                onClick={() => removeAddress(i)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <Field label="送付先名" placeholder="山田 太郎" className="col-span-2" />
              <Field label="送付先名カナ" placeholder="ヤマダ タロウ" className="col-span-2" />
              <Field label="電話番号" placeholder="090-0000-0000" className="col-span-2" type="tel" />
              <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
              <Select label="都道府県" options={["選択", "東京都", "大阪府"]} className="col-span-1" />
              <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
              <Field label="番地・建物" placeholder="千代田1-1-1 ビル10F" className="col-span-2" />
              <Toggle label="既定の送付先にする" defaultChecked={i === 1} hint="新規受注時、デフォルトで選ばれる送付先です。" />
              <Field label="ラベル" placeholder="自宅 / 勤務先 / 実家" className="col-span-3" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 取引・配送設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />取引・配送設定
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Select label="デフォルト支払方法" options={["クレジットカード", "銀行振込", "代金引換", "請求書払い", "コンビニ払い", "Amazon Pay"]} />
          <Select label="デフォルト配送方法" options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"]} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">取引開始日</label>
            <DatePicker placeholder="取引開始日を選択" />
          </div>
          <Field label="購入回数" type="number" defaultValue={isEdit ? "24" : "0"} unit="回" />
          <Field label="累計購入金額" type="number" defaultValue={isEdit ? "384200" : "0"} unit="円" />
          <Field label="平均単価" type="number" defaultValue={isEdit ? "16008" : "0"} unit="円" />
          <Select label="配送指定時間" options={["指定なし", "午前中", "12-14時", "14-16時", "16-18時", "18-20時", "19-21時"]} />
          <Field label="配送指示" placeholder="不在時は宅配ボックスへ" />
          <Select label="包装の希望" options={["指定なし", "簡易包装", "ギフト包装", "のし対応"]} />
        </div>
      </GlassCard>

      {/* 与信・リスク管理 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-400" />与信・リスク管理
          <HelpHint>掛売・後払いを許可する顧客向け。リスクスコアは支払遅延・キャンセル率から自動算出されます。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="与信限度額" type="number" placeholder="500000" unit="円" hint="この金額を超える未払い残高がある場合、新規受注をホールドします。" />
          <Field label="現在の与信使用額" type="number" defaultValue={isEdit ? "82400" : "0"} unit="円" />
          <Select label="リスクスコア" options={["A（低リスク）", "B（標準）", "C（要注意）", "D（高リスク）"]} />
          <Select label="取引承認状態" options={["承認済み", "条件付き承認", "保留", "停止中"]} />
          <Field label="信用調査会社" placeholder="帝国データバンク" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">信用調査日</label>
            <DatePicker placeholder="調査日を選択" />
          </div>
          <Toggle label="ブラックリスト登録" hint="ONにすると新規受注をブロックし、ブラックリスト一覧に表示されます。" />
          <Toggle label="掛売を許可する" defaultChecked />
        </div>
      </GlassCard>

      {/* タグ・属性 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />タグ・属性
          <HelpHint>マーケティング配信のセグメント化や、応対時の留意事項として活用します。</HelpHint>
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAG_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                tags.includes(t)
                  ? "bg-blue-500/20 border-blue-400/50 text-blue-700"
                  : "bg-white/50 border-white/50 text-gray-600 hover:bg-white/70"
              )}
            >
              {tags.includes(t) ? "✓ " : "+ "}
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="嗜好・好み" placeholder="赤ワイン / ホワイト系" />
          <Field label="アレルギー" placeholder="そば、エビ" />
          <Field label="特記事項" placeholder="箱潰れ厳禁・要丁寧梱包" />
        </div>
      </GlassCard>

      {/* 同意・通知設定 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-400" />同意・通知設定
          <HelpHint>個人情報保護法・特商法対応のための同意フラグ。OFF項目は配信対象から自動除外します。</HelpHint>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Toggle label="メール配信を希望する" defaultChecked />
          <Toggle label="DM（紙）の郵送を希望する" />
          <Toggle label="LINE通知を希望する" defaultChecked />
          <Toggle label="個人情報の利用に同意" defaultChecked hint="同意なしの顧客は社内CRM以外への共有が制限されます。" />
          <Toggle label="第三者提供に同意" />
          <Toggle label="プロファイリング利用に同意" defaultChecked />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/40">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">プライバシー同意日</label>
            <DatePicker placeholder="同意日を選択" />
          </div>
          <Field label="同意取得経路" placeholder="EC会員登録時" />
          <Field label="同意バージョン" placeholder="v2.3 (2025-04)" />
        </div>
      </GlassCard>

      {/* 会員情報・ポイント */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-400" />会員情報・ポイント
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="会員ID" placeholder="member_yamada" defaultValue={isEdit ? "member_yamada" : ""} />
          <Field label="会員ステータス" placeholder="アクティブ" defaultValue={isEdit ? "アクティブ" : ""} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">最終ログイン</label>
            <DatePicker placeholder="—" />
          </div>
          <Field label="ログイン回数" type="number" defaultValue={isEdit ? "184" : "0"} unit="回" />
          <Field label="保有ポイント" type="number" defaultValue={isEdit ? "3842" : "0"} unit="P" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">ポイント有効期限</label>
            <DatePicker placeholder="期限を選択" />
          </div>
          <Field label="獲得ポイント累計" type="number" defaultValue={isEdit ? "12480" : "0"} unit="P" />
          <Field label="使用ポイント累計" type="number" defaultValue={isEdit ? "8638" : "0"} unit="P" />
        </div>
      </GlassCard>

      {/* 紹介者情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />紹介者・紹介履歴
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="紹介者顧客コード" placeholder="CUS-0042" />
          <Field label="紹介者名" placeholder="佐藤 花子" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">紹介日</label>
            <DatePicker placeholder="紹介日を選択" />
          </div>
          <Select label="紹介報酬状態" options={["未付与", "付与済み", "対象外"]} />
          <Field label="紹介経由の購入金額" type="number" defaultValue="0" unit="円" />
          <Field label="紹介紹介人数" type="number" defaultValue={isEdit ? "2" : "0"} unit="人" hint="この顧客が紹介した別の顧客数。" />
        </div>
      </GlassCard>

      {/* 備考 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />備考・社内メモ
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              顧客向け備考
              <HelpHint side="right">マイページなどに表示される、顧客本人にも見える備考欄。</HelpHint>
            </label>
            <textarea
              rows={2}
              placeholder="顧客にも表示される備考..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              社内連絡欄（顧客非表示）
              <HelpHint side="right">クレーム履歴・要注意事項など、社内のみで共有する情報を記載。</HelpHint>
            </label>
            <textarea
              rows={3}
              placeholder="社内スタッフのみが閲覧できるメモ..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && (
          <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25 transition-all">
            削除
          </button>
        )}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all">
          キャンセル
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90 transition-all">
          {isEdit ? "更新" : "保存"}
        </button>
      </div>
    </div>
  );
}
