"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { HelpHint } from "@/components/ui/help-hint";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  Users,
  ShieldCheck,
  Banknote,
  Truck,
  Tag,
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
          "w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
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

const Toggle = ({ label, defaultChecked, hint }: { label: string; defaultChecked?: boolean; hint?: string }) => (
  <label className="flex items-center justify-between gap-2 text-sm text-gray-700 px-3 py-2 rounded-xl bg-white/50 border border-white/50">
    <span className="flex items-center gap-1.5">
      {label}
      {hint && <HelpHint side="right">{hint}</HelpHint>}
    </span>
    <input type="checkbox" defaultChecked={defaultChecked} className="accent-blue-500 w-4 h-4" />
  </label>
);

const TAG_OPTIONS = [
  "大口取引",
  "新規開拓",
  "海外取引",
  "EDI連携",
  "請求書PDF送付",
  "FAX注文",
  "店舗複数",
  "OEM対応",
];

export function WholesaleForm({ mode }: { mode: "create" | "edit" }) {
  const isEdit = mode === "edit";
  const [contacts, setContacts] = useState([1]);
  const [shippingPoints, setShippingPoints] = useState([1]);
  const [tags, setTags] = useState<string[]>(isEdit ? ["大口取引", "EDI連携"] : []);

  const d = isEdit
    ? {
        code: "WS-001",
        name: "株式会社ABC商事",
        contact: "山本部長",
      }
    : ({} as Record<string, string>);

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const addContact = () => contacts.length < 5 && setContacts([...contacts, contacts.length + 1]);
  const removeContact = (i: number) => setContacts(contacts.filter((n) => n !== i));
  const addShipPt = () => shippingPoints.length < 8 && setShippingPoints([...shippingPoints, shippingPoints.length + 1]);
  const removeShipPt = (i: number) => setShippingPoints(shippingPoints.filter((n) => n !== i));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "卸先編集" : "卸先登録"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            B to B取引先（卸先）の登録・編集ページ。法人情報・担当者・与信・取引条件・配送先を一画面で管理します。
          </p>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <button className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">
              削除
            </button>
          )}
          <button className="px-4 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
            キャンセル
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
            {isEdit ? "更新" : "保存"}
          </button>
        </div>
      </div>

      {isEdit && (
        <div className="text-xs text-gray-500">
          ダッシュボード &gt; 卸先マスタ &gt; <span className="text-blue-600">{d.name}</span> &gt; 編集
        </div>
      )}

      {/* 取引サマリー（編集モードのみ） */}
      {isEdit && (
        <GlassCard>
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />取引サマリー
            <HelpHint>編集対象卸先の取引実績ハイライト。詳細は卸先詳細ページから確認できます。</HelpHint>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "今月売上", value: "¥1,248,000" },
              { label: "今期累計", value: "¥18,420,500" },
              { label: "受注件数", value: "184", unit: "件" },
              { label: "未払残高", value: "¥482,000" },
              { label: "与信使用率", value: "78", unit: "%" },
              { label: "支払遅延", value: "0", unit: "回" },
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
          <Building2 className="h-4 w-4 text-gray-400" />基本情報
          <HelpHint>取引先を識別する法人情報。インボイス登録番号は請求書発行時に必須です。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="取引先コード" required placeholder="WS-001" defaultValue={d.code} hint="自動採番設定の場合は空欄で保存してください。" />
          <Field label="屋号・通称" placeholder="サンプル商店" />
          <Field label="法人名" required placeholder="株式会社サンプル" defaultValue={d.name} className="col-span-2" />
          <Field label="法人名カナ" placeholder="カブシキガイシャサンプル" className="col-span-2" />
          <Field label="法人番号" placeholder="1234567890123" hint="国税庁が指定する13桁の法人番号。" />
          <Field label="インボイス登録番号" placeholder="T1234567890123" hint="2023年10月以降、適格請求書発行に必要。" />
          <Field label="代表者名" placeholder="山田 太郎" />
          <Field label="代表者役職" placeholder="代表取締役" />
          <Select label="業種" options={["小売業", "卸売業", "製造業", "飲食業", "サービス業", "その他"]} />
          <Select label="従業員規模" options={["1-10名", "11-50名", "51-100名", "101-500名", "501名以上"]} />
          <Field label="設立年月" placeholder="1985-04" />
          <Field label="資本金" type="number" placeholder="50000000" unit="円" />
          <Field label="決算月" placeholder="3月" />
          <Field label="Webサイト" placeholder="https://example.com" className="col-span-2" />
          <Select label="取引ステータス" options={["新規取引", "通常取引", "重点取引先", "取引停止", "取引解消"]} />
        </div>
      </GlassCard>

      {/* 担当者情報（複数） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />担当者情報（{contacts.length}/5名）
            <HelpHint>取引先の窓口担当者を最大5名まで登録。発注・経理・配送など役割別に登録できます。</HelpHint>
          </h2>
          {contacts.length < 5 && (
            <button onClick={addContact} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus className="h-4 w-4" />担当者を追加
            </button>
          )}
        </div>
        {contacts.map((i) => (
          <GlassCard key={i}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">担当者 {i}{i === 1 && "（主担当）"}</h3>
              {contacts.length > 1 && (
                <button onClick={() => removeContact(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Field label="担当者名" required placeholder="田中 花子" defaultValue={i === 1 ? d.contact : ""} />
              <Field label="担当者カナ" placeholder="タナカ ハナコ" />
              <Field label="部署名" placeholder="仕入部" />
              <Field label="役職" placeholder="主任" />
              <Select label="役割" options={["発注担当", "経理担当", "配送担当", "決裁者", "その他"]} />
              <Field label="電話" placeholder="03-0000-0000" type="tel" />
              <Field label="携帯" placeholder="090-0000-0000" type="tel" />
              <Field label="メール" placeholder="tanaka@example.com" type="email" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 連絡先・住所 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />代表連絡先・本社住所
        </h2>
        <div className="grid grid-cols-6 gap-4">
          <Field label="代表電話" required placeholder="03-0000-0000" className="col-span-2" type="tel" />
          <Field label="代表FAX" placeholder="03-0000-0000" className="col-span-2" type="tel" />
          <Field label="代表メール" placeholder="info@example.com" className="col-span-2" type="email" />
          <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
          <Select label="都道府県" options={["選択", "東京都", "大阪府", "北海道", "福岡県"]} className="col-span-1" />
          <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
          <Field label="番地" placeholder="千代田1-1-1" className="col-span-2" />
          <Field label="建物名・部屋番号" placeholder="サンプルビル 10F" className="col-span-6" />
        </div>
      </GlassCard>

      {/* 取引条件 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" />取引条件
          <HelpHint>掛売／前払い・締日／支払サイトなど、請求・回収サイクルを規定します。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Select label="取引区分" required options={["掛売", "前払い", "都度払い", "委託"]} />
          <Select label="価格グループ" options={["A（標準卸）", "S（特別卸）", "B（大口）", "C（小口）"]} hint="商品マスタの卸価格テーブルと連動します。" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">取引開始日</label>
            <DatePicker placeholder="取引開始日を選択" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">契約更新日</label>
            <DatePicker placeholder="次回更新日" />
          </div>
          <Select label="締日" options={["毎月末日", "毎月10日", "毎月15日", "毎月20日", "毎月25日"]} />
          <Select label="支払方法" options={["銀行振込", "現金", "小切手", "手形", "ファクタリング"]} />
          <Select label="支払サイト" options={["翌月末払い", "翌々月末払い", "30日後", "60日後", "90日後", "120日後"]} hint="締日からの支払期限。長くなるほど与信リスクが高くなります。" />
          <Select label="課税区分" options={["課税", "非課税", "免税"]} />
          <Field label="最低発注金額" type="number" placeholder="10000" unit="円" />
          <Select label="送料負担" options={["自社負担", "客先負担", "条件付き自社負担"]} />
          <Field label="送料免除条件" placeholder="3万円以上で送料無料" />
          <Field label="手数料率" type="number" placeholder="0" unit="%" />
          <Select label="基本割引率" options={["0%", "5%", "10%", "15%", "20%", "25%", "30%"]} />
          <Field label="割引適用条件" placeholder="月末決済" />
          <Select label="価格表バージョン" options={["2025年版", "2026年春版", "2026年秋版"]} />
          <Field label="EDI接続コード" placeholder="EDI-12345" hint="EDI連携している場合の取引先識別コード。" />
        </div>
      </GlassCard>

      {/* 与信管理 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gray-400" />与信管理
          <HelpHint>与信限度額を超える未払残高があると新規受注を自動ホールドします。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="与信限度額" type="number" placeholder="500000" unit="円" />
          <Field label="現在の与信使用額" type="number" defaultValue={isEdit ? "482000" : "0"} unit="円" />
          <Field label="与信使用率" type="number" defaultValue={isEdit ? "78" : "0"} unit="%" />
          <Select label="与信ランク" options={["A（優良）", "B（標準）", "C（要注意）", "D（取引制限）"]} />
          <Field label="信用調査会社" placeholder="帝国データバンク / 東京商工リサーチ" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">最終調査日</label>
            <DatePicker placeholder="調査日を選択" />
          </div>
          <Field label="信用度スコア" type="number" placeholder="65" hint="信用調査会社のスコア。50未満は要注意。" />
          <Select label="保証契約" options={["なし", "保証協会", "ファクタリング", "その他"]} />
          <Toggle label="与信自動ホールド" defaultChecked hint="ONの場合、与信オーバー時に新規受注を自動的に保留します。" />
          <Toggle label="支払遅延アラート" defaultChecked />
          <Toggle label="与信枠交渉中" hint="現在与信枠の見直し交渉中であることを示すフラグ。" />
          <Toggle label="取引停止" hint="ONにすると新規受注をすべてブロックします。" />
        </div>
      </GlassCard>

      {/* 振込先情報 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-gray-400" />振込先情報
          <HelpHint>取引先からの返金・支払振込先口座。複数口座運用の場合、主口座と副口座を区別します。</HelpHint>
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <Field label="銀行名" placeholder="三井住友銀行" />
          <Field label="銀行コード" placeholder="0009" />
          <Field label="支店名" placeholder="本店" />
          <Field label="支店コード" placeholder="001" />
          <Select label="口座種別" options={["普通", "当座", "貯蓄"]} />
          <Field label="口座番号" placeholder="0000000" />
          <Field label="口座名義" placeholder="カ）サンプル" className="col-span-2" />
          <Field label="口座名義カナ" placeholder="カブシキガイシャサンプル" className="col-span-2" />
          <Field label="SWIFTコード" placeholder="SMBCJPJT" hint="海外送金時に必要。国内のみなら空欄で構いません。" />
          <Field label="副口座（用途）" placeholder="返金専用 / プロモ用" />
        </div>
      </GlassCard>

      {/* 配送先（複数） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-400" />配送先（{shippingPoints.length}/8件）
            <HelpHint>本社・倉庫・店舗・物流センターなど、納品先を最大8件登録できます。</HelpHint>
          </h2>
          {shippingPoints.length < 8 && (
            <button onClick={addShipPt} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Plus className="h-4 w-4" />配送先を追加
            </button>
          )}
        </div>
        {shippingPoints.map((i) => (
          <GlassCard key={i}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">配送先 {i}{i === 1 && "（既定）"}</h3>
              {shippingPoints.length > 1 && (
                <button onClick={() => removeShipPt(i)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-4">
              <Field label="配送先名" placeholder="サンプル商店 倉庫" className="col-span-2" />
              <Select label="種別" options={["本社", "倉庫", "店舗", "物流センター", "工場"]} className="col-span-1" />
              <Field label="配送先電話" placeholder="03-0000-0000" type="tel" className="col-span-1" />
              <Field label="配送担当者" placeholder="倉庫長 鈴木" className="col-span-2" />
              <Field label="郵便番号" placeholder="100-0001" className="col-span-1" />
              <Select label="都道府県" options={["選択", "東京都", "大阪府"]} className="col-span-1" />
              <Field label="市区町村" placeholder="千代田区" className="col-span-2" />
              <Field label="番地・建物" placeholder="千代田1-1-1" className="col-span-2" />
              <Select label="既定の配送方法" options={["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運", "自社便"]} className="col-span-2" />
              <Field label="納品時間指定" placeholder="平日 9-17時のみ" className="col-span-2" />
              <Field label="搬入口・指示" placeholder="裏口・地下1F搬入" className="col-span-2" />
              <div className="space-y-1.5 col-span-6">
                <label className="text-sm font-medium text-gray-700">配送注意事項</label>
                <textarea
                  rows={2}
                  placeholder="納品時間指定、搬入口の場所、検品ルールなど..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* タグ・属性 */}
      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />タグ・属性
          <HelpHint>取引先の特性をタグ化し、レポート絞込み・営業セグメント化に活用できます。</HelpHint>
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
          <Field label="取扱商品グループ" placeholder="食品 / 雑貨 / アパレル" />
          <Field label="主要販売チャネル" placeholder="店舗 / EC / 卸" />
          <Field label="競合関係" placeholder="競合品目あり" />
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
              請求書・取引書類への備考
              <HelpHint side="right">取引先にも見える備考。請求書PDFや納品書に印字されます。</HelpHint>
            </label>
            <textarea
              rows={2}
              placeholder="お振込手数料はご負担ください。等..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              社内メモ（取引先非表示）
              <HelpHint side="right">取引履歴・注意事項・社内向けメモなど、取引先には表示されません。</HelpHint>
            </label>
            <textarea
              rows={4}
              placeholder="支払遅延履歴、担当者の癖、社内向けメモなど..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && (
          <button className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">
            削除
          </button>
        )}
        <button className="px-5 py-2.5 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80">
          キャンセル
        </button>
        <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/80 border border-blue-400/50 text-white hover:bg-blue-500/90">
          {isEdit ? "更新" : "保存"}
        </button>
      </div>
    </div>
  );
}
