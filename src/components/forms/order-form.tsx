"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Plus, Trash2, ShoppingCart, User, MapPin, CreditCard, FileText } from "lucide-react";

const STORES = ["楽天市場", "Amazon", "Yahoo!ショッピング", "Shopify", "自社EC", "卸売", "電話受注"];
const STATUSES = ["新規受付", "確認待ち", "出荷待ち", "出荷済み", "完了"];
const TAGS = ["なし", "優先対応", "ギフト", "リピーター"];
const DELIVERY_TYPES = ["通常", "急ぎ", "予約販売"];
const CARRIERS = ["ヤマト運輸", "佐川急便", "日本郵便", "西濃運輸", "福山通運"];
const PREFECTURES = ["", "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
const TIME_SLOTS = ["指定なし", "午前中", "12-14時", "14-16時", "16-18時", "18-20時"];
const PAY_METHODS = ["クレジットカード", "銀行振込", "代金引換", "請求書払い", "コンビニ払い"];
const PAY_STATUSES = ["未入金", "一部入金", "入金済み", "返金済み"];

type Item = { id: number; code: string; name: string; price: number; qty: number };

interface OrderFormProps {
  mode: "create" | "edit";
}

export function OrderForm({ mode }: OrderFormProps) {
  const toast = useToast();
  const isEdit = mode === "edit";

  const [store, setStore] = useState(STORES[0]);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [orderStatus, setOrderStatus] = useState(STATUSES[0]);
  const [mallId, setMallId] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [deliveryType, setDeliveryType] = useState(DELIVERY_TYPES[0]);

  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerKana, setCustomerKana] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [company, setCompany] = useState("");

  const [shipName, setShipName] = useState("");
  const [shipTel, setShipTel] = useState("");
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [zip, setZip] = useState("");
  const [pref, setPref] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [shipDate, setShipDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);

  const [items, setItems] = useState<Item[]>([
    { id: 1, code: "", name: "", price: 0, qty: 1 },
  ]);

  const [shippingFee, setShippingFee] = useState(0);
  const [paymentFee, setPaymentFee] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [payMethod, setPayMethod] = useState(PAY_METHODS[0]);
  const [payStatus, setPayStatus] = useState(PAY_STATUSES[0]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paidDate, setPaidDate] = useState<Date | undefined>(undefined);

  const [customerNote, setCustomerNote] = useState("");
  const [internalMemo, setInternalMemo] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const tax = useMemo(() => Math.floor((subtotal + shippingFee + paymentFee - discount) * 0.1), [subtotal, shippingFee, paymentFee, discount]);
  const total = subtotal + shippingFee + paymentFee - discount + tax;

  function addItem() {
    setItems((prev) => [...prev, { id: Math.max(0, ...prev.map((p) => p.id)) + 1, code: "", name: "", price: 0, qty: 1 }]);
  }
  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function updItem(id: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function validate(): string | null {
    if (!customerName.trim()) return "顧客名を入力してください";
    if (!email.trim()) return "メールアドレスを入力してください";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "メールアドレスの形式が不正です";
    if (items.length === 0) return "商品明細を1件以上追加してください";
    const invalid = items.find((i) => !i.name.trim() || i.price < 0 || i.qty < 1);
    if (invalid) return "商品明細の商品名・単価・数量を確認してください";
    return null;
  }

  function save() {
    const err = validate();
    if (err) return toast.show(err, "error");
    toast.show(isEdit ? "受注を更新しました" : "受注を登録しました");
  }

  function cancelOrder() {
    setCancelOpen(false);
    toast.show("受注をキャンセルしました", "info");
  }

  const formatYen = (n: number) => `¥${n.toLocaleString()}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "受注編集" : "受注登録"}</h1>
        <div className="flex gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="px-4 py-2 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25"
            >
              キャンセル受注
            </button>
          )}
          <SecondaryButton onClick={() => history.back()}>戻る</SecondaryButton>
          <PrimaryButton onClick={save}>{isEdit ? "更新" : "保存"}</PrimaryButton>
        </div>
      </div>

      {isEdit && <div className="text-xs text-gray-500">ダッシュボード &gt; 受注一覧 &gt; <span className="text-blue-600">ORD-2026-00851</span> &gt; 編集</div>}

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-gray-400" />受注情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="受注番号" value={isEdit ? "ORD-2026-00851" : "（自動採番）"} onChange={() => {}} disabled />
          <SelectInput label="店舗" required value={store} onChange={setStore} options={STORES} />
          <div className="space-y-1.5">
            <FieldLabel>受注日時</FieldLabel>
            <DatePicker value={orderDate} onChange={setOrderDate} placeholder="受注日を選択" />
          </div>
          <SelectInput label="受注ステータス" value={orderStatus} onChange={setOrderStatus} options={STATUSES} />
          <Input label="モール側注文ID" value={mallId} onChange={setMallId} placeholder="123456789" />
          <Input label="伝票番号" value="" onChange={() => {}} placeholder="（自動採番）" disabled />
          <SelectInput label="受注タグ" value={tag} onChange={setTag} options={TAGS} />
          <SelectInput label="納期区分" value={deliveryType} onChange={setDeliveryType} options={DELIVERY_TYPES} />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />注文者情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input label="顧客コード" value={customerCode} onChange={setCustomerCode} placeholder="CUS-0001（既存顧客を選択）" className="md:col-span-2" />
          <Input label="顧客名" required value={customerName} onChange={setCustomerName} placeholder="山田 太郎" />
          <Input label="顧客名カナ" value={customerKana} onChange={setCustomerKana} placeholder="ヤマダ タロウ" />
          <Input label="メールアドレス" required type="email" value={email} onChange={setEmail} placeholder="example@mail.com" className="md:col-span-2" />
          <Input label="電話番号" type="tel" value={tel} onChange={setTel} placeholder="090-0000-0000" />
          <Input label="会社名" value={company} onChange={setCompany} placeholder="株式会社サンプル" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />配送先</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Input label="配送先名" value={shipName} onChange={setShipName} placeholder="山田 太郎" className="md:col-span-2" />
          <Input label="配送先電話" type="tel" value={shipTel} onChange={setShipTel} placeholder="090-0000-0000" className="md:col-span-2" />
          <SelectInput label="配送方法" required value={carrier} onChange={setCarrier} options={CARRIERS} className="md:col-span-2" />
          <Input label="郵便番号" value={zip} onChange={setZip} placeholder="100-0001" className="md:col-span-1" />
          <SelectInput label="都道府県" value={pref} onChange={setPref} options={PREFECTURES} className="md:col-span-1" />
          <Input label="市区町村" value={city} onChange={setCity} placeholder="千代田区" className="md:col-span-2" />
          <Input label="番地・建物" value={address} onChange={setAddress} placeholder="千代田1-1-1 ビル10F" className="md:col-span-2" />
          <div className="space-y-1.5 md:col-span-3">
            <FieldLabel>配送希望日</FieldLabel>
            <DatePicker value={shipDate} onChange={setShipDate} placeholder="配送希望日を選択" />
          </div>
          <SelectInput label="配送時間帯" value={timeSlot} onChange={setTimeSlot} options={TIME_SLOTS} className="md:col-span-3" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">商品明細</h2>
          <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" />商品を追加
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">商品コード</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">単価</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-20">数量</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">小計</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500 text-xs">商品明細がありません。「商品を追加」から行を追加してください。</td></tr>
              ) : items.map((i) => (
                <tr key={i.id} className="border-t border-white/30">
                  <td className="px-3 py-2">
                    <input value={i.code} onChange={(e) => updItem(i.id, { code: e.target.value })} placeholder="WEP-001" className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50 font-mono" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={i.name} onChange={(e) => updItem(i.id, { name: e.target.value })} placeholder="ワイヤレスイヤホン Pro" className="h-7 w-full px-2 rounded-lg text-xs bg-white/50 border border-white/50" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={i.price} onChange={(e) => updItem(i.id, { price: Number(e.target.value) || 0 })} className="h-7 w-24 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right tabular-nums" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={1} value={i.qty} onChange={(e) => updItem(i.id, { qty: Number(e.target.value) || 1 })} className="h-7 w-16 px-2 rounded-lg text-xs bg-white/50 border border-white/50 text-center tabular-nums" />
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{formatYen(i.price * i.qty)}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeItem(i.id)} aria-label="行を削除" className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-end gap-8"><span className="text-gray-500 w-24 text-right">小計</span><span className="w-32 text-right text-gray-700 tabular-nums">{formatYen(subtotal)}</span></div>
          <div className="flex justify-end gap-8 items-center">
            <label className="text-gray-500 w-24 text-right">送料</label>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">¥</span>
              <input type="number" min={0} value={shippingFee} onChange={(e) => setShippingFee(Number(e.target.value) || 0)} className="h-7 w-full pl-5 pr-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right tabular-nums" />
            </div>
          </div>
          <div className="flex justify-end gap-8 items-center">
            <label className="text-gray-500 w-24 text-right">手数料</label>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">¥</span>
              <input type="number" min={0} value={paymentFee} onChange={(e) => setPaymentFee(Number(e.target.value) || 0)} className="h-7 w-full pl-5 pr-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right tabular-nums" />
            </div>
          </div>
          <div className="flex justify-end gap-8 items-center">
            <label className="text-gray-500 w-24 text-right">割引</label>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">¥</span>
              <input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="h-7 w-full pl-5 pr-2 rounded-lg text-xs bg-white/50 border border-white/50 text-right tabular-nums" />
            </div>
          </div>
          <div className="flex justify-end gap-8"><span className="text-gray-500 w-24 text-right">消費税 (10%)</span><span className="w-32 text-right text-gray-700 tabular-nums">{formatYen(tax)}</span></div>
          <div className="flex justify-end gap-8 pt-2 border-t border-white/40">
            <span className="font-medium text-gray-800 w-24 text-right">合計</span>
            <span className="w-32 text-right font-bold text-gray-800 text-lg tabular-nums">{formatYen(total)}</span>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />支払情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectInput label="支払方法" required value={payMethod} onChange={setPayMethod} options={PAY_METHODS} />
          <SelectInput label="入金状態" value={payStatus} onChange={setPayStatus} options={PAY_STATUSES} />
          <Input label="入金額" type="number" value={String(paidAmount)} onChange={(v) => setPaidAmount(Number(v) || 0)} placeholder="0" />
          <div className="space-y-1.5">
            <FieldLabel>入金日</FieldLabel>
            <DatePicker value={paidDate} onChange={setPaidDate} placeholder="入金日を選択" />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />備考</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>顧客備考</FieldLabel>
            <textarea rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="顧客からの要望など..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>社内メモ</FieldLabel>
            <textarea rows={3} value={internalMemo} onChange={(e) => setInternalMemo(e.target.value)} placeholder="社内向けメモ..." className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-2 pt-2">
        {isEdit && (
          <button type="button" onClick={() => setCancelOpen(true)} className="px-5 py-2.5 rounded-xl text-sm bg-red-500/15 border border-red-500/30 text-red-700 hover:bg-red-500/25">
            キャンセル受注
          </button>
        )}
        <SecondaryButton onClick={() => history.back()} className="px-5 py-2.5">戻る</SecondaryButton>
        <PrimaryButton onClick={save} className="px-5 py-2.5">{isEdit ? "更新" : "保存"}</PrimaryButton>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="受注キャンセル確認"
        size="sm"
        footer={
          <>
            <SecondaryButton onClick={() => setCancelOpen(false)}>戻る</SecondaryButton>
            <PrimaryButton onClick={cancelOrder} className="bg-red-500/90 hover:bg-red-600/90">キャンセルする</PrimaryButton>
          </>
        }
      >
        <p className="text-sm text-gray-700">この受注をキャンセルします。在庫引当は解除されます。よろしいですか？</p>
      </Modal>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-700">
      {children} {required && <span className="text-red-500 text-xs">*必須</span>}
    </label>
  );
}

function Input({
  label, required, value, onChange, placeholder, type = "text", className, disabled,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; disabled?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      />
    </div>
  );
}

function SelectInput({
  label, required, value, onChange, options, className,
}: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; options: string[]; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => <option key={o} value={o}>{o === "" ? "選択してください" : o}</option>)}
      </select>
    </div>
  );
}
