"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { HelpHint } from "@/components/ui/help-hint";
import { DatePicker } from "@/components/ui/date-picker";
import { PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Clock,
  Mail,
  Plus,
  Send,
  Trash2,
  User,
} from "lucide-react";

// ---------- 型定義 ----------

type Priority = "高" | "通常" | "低";
type MailType = "サンクスメール" | "出荷通知" | "入金確認" | "フォロー" | "お詫び" | "事務連絡" | "営業" | "その他";
type SendMode = "即時" | "予約";

type Recipient = {
  id: string;
  to: string;
  customer: string;
};

// ---------- サンプルテンプレート ----------

const FREE_TEMPLATES = [
  {
    name: "発送遅延のお詫び",
    subject: "【お詫び】商品発送遅延についてのご連絡",
    body: "{{customer_name}} 様\n\nいつも {{shop_name}} をご利用いただきありがとうございます。\n\nこの度は商品の発送が遅延しておりまして、大変申し訳ございません。\n発送見込み日：[発送見込み日を入力]\n\nご不便をおかけして誠に申し訳ございません。\n何かご不明な点がございましたらお気軽にご連絡ください。\n\n{{shop_name}} カスタマーサポート",
  },
  {
    name: "在庫切れのご連絡",
    subject: "【ご連絡】ご注文商品の在庫切れについて",
    body: "{{customer_name}} 様\n\nご注文いただきました商品が在庫切れとなっておりまして、大変申し訳ございません。\n\n以下よりご対応をお選びください。\n① 入荷まで（約○週間）お待ちいただく\n② キャンセルおよびご返金\n③ 代替品（別途ご案内）\n\nご希望の対応をご返信にてお知らせください。\n\n{{shop_name}} カスタマーサポート",
  },
  {
    name: "キャンセル受付",
    subject: "【受付完了】キャンセル受付のお知らせ",
    body: "{{customer_name}} 様\n\nご注文のキャンセルを承りました。\nご注文番号：[注文番号]\n\n返金については[○営業日]以内にご指定の口座へ返金いたします。\n\n引き続きよろしくお願いいたします。\n\n{{shop_name}} カスタマーサポート",
  },
  {
    name: "お問い合わせ返信",
    subject: "Re: {{shop_name}} お問い合わせの件",
    body: "{{customer_name}} 様\n\nお問い合わせいただきありがとうございます。\n\n[回答内容を入力]\n\n他にご不明な点がございましたら、お気軽にご連絡ください。\n\n{{shop_name}} カスタマーサポート",
  },
];

const CUSTOMER_SUGGESTIONS = [
  { to: "yamada@example.com", customer: "山田 太郎" },
  { to: "sato@example.com", customer: "佐藤 花子" },
  { to: "tanaka@example.com", customer: "田中 一郎" },
  { to: "watanabe@example.com", customer: "渡辺 美咲" },
  { to: "kimura@example.com", customer: "木村 健" },
  { to: "ito@example.com", customer: "伊藤 さくら" },
  { to: "kobayashi@example.com", customer: "小林 大輔" },
  { to: "yoshida@example.com", customer: "吉田 あゆみ" },
];

const MAIL_TYPES: MailType[] = ["サンクスメール", "出荷通知", "入金確認", "フォロー", "お詫び", "事務連絡", "営業", "その他"];

// ---------- 宛先行コンポーネント ----------

type RecipientRowProps = {
  recipient: Recipient;
  onUpdate: (id: string, patch: Partial<Omit<Recipient, "id">>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
};

function RecipientRow({ recipient, onUpdate, onRemove, canRemove }: RecipientRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={recipient.to}
          onChange={(e) => onUpdate(recipient.id, { to: e.target.value })}
          placeholder="宛先メールアドレス"
          className="w-full h-9 pl-9 pr-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      <div className="w-44 relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={recipient.customer}
          onChange={(e) => onUpdate(recipient.id, { customer: e.target.value })}
          placeholder="顧客名（任意）"
          className="w-full h-9 pl-9 pr-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(recipient.id)}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-600 transition-colors shrink-0"
          title="宛先を削除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------- メインコンポーネント ----------

let recipientCounter = 1;

function genId() {
  return `rec-${++recipientCounter}-${Date.now()}`;
}

export default function MailComposePage() {
  const router = useRouter();
  const toast = useToast();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // 宛先
  const [recipients, setRecipients] = useState<Recipient[]>([{ id: "rec-1", to: "", customer: "" }]);

  // メール内容
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mailType, setMailType] = useState<MailType>("その他");
  const [priority, setPriority] = useState<Priority>("通常");
  const [sendMode, setSendMode] = useState<SendMode>("即時");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [signature, setSignature] = useState("デフォルト署名を使用");

  // テンプレートサジェスト表示
  const [showTemplates, setShowTemplates] = useState(false);
  // 顧客サジェスト
  const [activeSuggestId, setActiveSuggestId] = useState<string | null>(null);

  // ---------- 宛先操作 ----------

  const updateRecipient = useCallback((id: string, patch: Partial<Omit<Recipient, "id">>) => {
    setRecipients((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addRecipient = useCallback(() => {
    setRecipients((prev) => [...prev, { id: genId(), to: "", customer: "" }]);
  }, []);

  const applySuggestion = useCallback((id: string, sug: typeof CUSTOMER_SUGGESTIONS[number]) => {
    updateRecipient(id, { to: sug.to, customer: sug.customer });
    setActiveSuggestId(null);
  }, [updateRecipient]);

  // ---------- テンプレート適用 ----------

  const applyTemplate = useCallback((tpl: typeof FREE_TEMPLATES[number]) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
    setShowTemplates(false);
    toast.show(`「${tpl.name}」を適用しました`, "info");
  }, [toast]);

  // ---------- バリデーション ----------

  const validate = useCallback((): string | null => {
    const validRecipients = recipients.filter((r) => r.to.trim() !== "");
    if (validRecipients.length === 0) return "宛先を1件以上入力してください";
    const invalidEmail = validRecipients.find((r) => !r.to.includes("@"));
    if (invalidEmail) return `「${invalidEmail.to}」はメールアドレスの形式が正しくありません`;
    if (subject.trim() === "") return "件名を入力してください";
    if (body.trim() === "") return "本文を入力してください";
    if (sendMode === "予約" && !scheduledDate) return "送信予約日を選択してください";
    return null;
  }, [recipients, subject, body, sendMode, scheduledDate]);

  // ---------- 送信 ----------

  const handleSend = useCallback(() => {
    const err = validate();
    if (err) {
      toast.show(err, "error");
      return;
    }
    const validRecipients = recipients.filter((r) => r.to.trim() !== "");
    if (sendMode === "即時") {
      toast.show(`${validRecipients.length} 件のメールを送信しました`, "success");
    } else {
      const dateStr = scheduledDate
        ? `${scheduledDate.getFullYear()}/${String(scheduledDate.getMonth() + 1).padStart(2, "0")}/${String(scheduledDate.getDate()).padStart(2, "0")}`
        : "—";
      toast.show(`${validRecipients.length} 件を ${dateStr} ${scheduledTime} に予約しました`, "success");
    }
    router.push("/mail");
  }, [validate, recipients, sendMode, scheduledDate, scheduledTime, router, toast]);

  // ---------- 本文へ変数挿入 ----------

  const insertVariable = useCallback((v: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + v);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBody((prev) => prev.slice(0, start) + v + prev.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  }, []);

  const variables = ["{{customer_name}}", "{{shop_name}}", "{{order_id}}", "{{order_date}}", "{{total_amount}}", "{{tracking_number}}", "{{delivery_date}}", "{{payment_deadline}}"];

  return (
    <div className="space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/mail")}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white/60 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">フリーメール送信</h1>
            <HelpHint>任意の宛先に対してメールを作成・送信します。テンプレートから呼び出して編集することもできます。</HelpHint>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-8">宛先・件名・本文を入力して即時送信または予約送信できます。</p>
        </div>
        <div className="flex gap-2">
          <SecondaryButton onClick={() => router.push("/mail")}>キャンセル</SecondaryButton>
          <PrimaryButton onClick={handleSend}>
            <span className="inline-flex items-center gap-1.5">
              {sendMode === "即時" ? <Send className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {sendMode === "即時" ? "送信" : "予約登録"}
            </span>
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* メイン入力エリア */}
        <div className="space-y-4">

          {/* 宛先 */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">宛先</h2>
              <button
                type="button"
                onClick={addRecipient}
                className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />宛先を追加
              </button>
            </div>
            <div className="space-y-2">
              {recipients.map((r) => (
                <div key={r.id} className="relative">
                  <RecipientRow
                    recipient={r}
                    onUpdate={updateRecipient}
                    onRemove={removeRecipient}
                    canRemove={recipients.length > 1}
                  />
                  {/* 顧客サジェスト */}
                  <button
                    type="button"
                    onClick={() => setActiveSuggestId(activeSuggestId === r.id ? null : r.id)}
                    className="mt-1 text-[11px] text-blue-500 hover:text-blue-700"
                  >
                    顧客マスタから選択
                  </button>
                  {activeSuggestId === r.id && (
                    <div className="absolute z-20 top-full left-0 mt-1 w-72 rounded-xl bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
                      {CUSTOMER_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug.to}
                          type="button"
                          onClick={() => applySuggestion(r.id, sug)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-500/10 transition-colors"
                        >
                          <span className="font-medium text-gray-800">{sug.customer}</span>
                          <span className="text-gray-400 text-xs ml-2">{sug.to}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* 基本情報 */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs text-gray-500">件名 <span className="text-red-500">必須</span></label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="メールの件名を入力"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">種別</label>
                <select
                  value={mailType}
                  onChange={(e) => setMailType(e.target.value as MailType)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {MAIL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">優先度</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="高">高</option>
                  <option value="通常">通常</option>
                  <option value="低">低</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* 本文 */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">
                本文 <span className="text-red-500 text-xs">必須</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Mail className="h-3.5 w-3.5" />テンプレートから選択
              </button>
            </div>

            {showTemplates && (
              <div className="mb-3 rounded-xl bg-white/50 border border-white/50 overflow-hidden">
                {FREE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left px-3 py-2.5 text-sm border-b border-white/40 last:border-b-0 hover:bg-blue-500/10 transition-colors"
                  >
                    <div className="font-medium text-gray-800">{tpl.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{tpl.subject}</div>
                  </button>
                ))}
              </div>
            )}

            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="メール本文を入力してください。&#10;差込変数は右パネルのボタンから挿入できます。"
              rows={16}
              className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono leading-relaxed resize-none"
            />
            <div className="mt-1.5 text-xs text-gray-400 text-right">{body.length} 文字</div>
          </GlassCard>

          {/* 送信設定 */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">送信設定</h2>
            <div className="space-y-4">
              {/* 送信モード */}
              <div className="flex gap-3">
                {(["即時", "予約"] as SendMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSendMode(mode)}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      sendMode === mode
                        ? "bg-blue-500/15 text-blue-700 border-blue-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                        : "bg-white/50 text-gray-600 border-white/50 hover:bg-white/70"
                    )}
                  >
                    {mode === "即時" ? (
                      <span className="inline-flex items-center justify-center gap-1.5"><Send className="h-4 w-4" />即時送信</span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5"><Clock className="h-4 w-4" />予約送信</span>
                    )}
                  </button>
                ))}
              </div>

              {/* 予約日時設定 */}
              {sendMode === "予約" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">送信予約日 <span className="text-red-500">必須</span></label>
                    <DatePicker
                      placeholder="送信日を選択"
                      value={scheduledDate}
                      onChange={setScheduledDate}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">送信時刻</label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 署名 */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">署名</label>
                <select
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="デフォルト署名を使用">デフォルト署名を使用</option>
                  <option value="VIP顧客向け署名">VIP顧客向け署名</option>
                  <option value="署名なし">署名なし</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* サイドパネル */}
        <div className="space-y-4">

          {/* 差込変数 */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-800">差込変数</h2>
              <HelpHint>クリックすると本文のカーソル位置に変数を挿入します。</HelpHint>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-1 rounded-lg text-[11px] font-mono bg-white/60 border border-white/60 hover:bg-blue-500/10 hover:text-blue-700 text-gray-600 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* 送信前チェック */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">送信前チェック</h2>
            <ul className="space-y-2 text-xs">
              {[
                { label: "宛先入力済み", ok: recipients.some((r) => r.to.trim() !== "" && r.to.includes("@")) },
                { label: "件名入力済み", ok: subject.trim() !== "" },
                { label: "本文入力済み", ok: body.trim() !== "" },
                { label: "予約日設定済み", ok: sendMode === "即時" || !!scheduledDate },
              ].map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2", c.ok ? "text-emerald-600" : "text-gray-400")}>
                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", c.ok ? "bg-emerald-500/20" : "bg-gray-500/10")}>
                    {c.ok ? "✓" : "○"}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* 送信概要 */}
          <GlassCard>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">送信概要</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-400">宛先件数</dt>
                <dd className="text-gray-700 font-medium">{recipients.filter((r) => r.to.trim() !== "").length} 件</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">種別</dt>
                <dd className="text-gray-700">{mailType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">優先度</dt>
                <dd className="text-gray-700">{priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">送信モード</dt>
                <dd className="text-gray-700">{sendMode}</dd>
              </div>
              {sendMode === "予約" && scheduledDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">予約日時</dt>
                  <dd className="text-gray-700">
                    {scheduledDate.getFullYear()}/{String(scheduledDate.getMonth() + 1).padStart(2, "0")}/{String(scheduledDate.getDate()).padStart(2, "0")} {scheduledTime}
                  </dd>
                </div>
              )}
            </dl>
          </GlassCard>

          {/* 送信ボタン（モバイル用 sticky） */}
          <div className="flex flex-col gap-2 lg:hidden">
            <PrimaryButton onClick={handleSend}>
              <span className="inline-flex items-center gap-1.5">
                {sendMode === "即時" ? <Send className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {sendMode === "即時" ? "今すぐ送信" : "予約登録"}
              </span>
            </PrimaryButton>
            <SecondaryButton onClick={() => router.push("/mail")}>キャンセル</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
