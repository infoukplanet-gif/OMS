"use client";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { ShoppingCart, Truck, Tag, Package, Users, CreditCard, ClipboardList, Mail, BarChart3, Settings, Bot, Link as LinkIcon } from "lucide-react";

const categories = [
  {
    icon: ShoppingCart, color: "from-blue-500 to-blue-400", bg: "bg-blue-500/10", text: "text-blue-600",
    name: "受注管理", items: [
      { label: "受注一覧", href: "/orders" },
      { label: "受注詳細", href: "/orders/details" },
      { label: "受注明細一覧", href: "/orders/items" },
      { label: "受注明細検索", href: "/orders/items/search" },
      { label: "一括登録(CSV)", href: "/orders/import" },
      { label: "登録パターン", href: "/orders/import-patterns" },
      { label: "伝票有効化", href: "/orders/activate" },
      { label: "備考欄確認", href: "/orders/notes" },
      { label: "備考欄変換", href: "/orders/notes/conversion" },
      { label: "分類タグ", href: "/orders/tags" },
      { label: "確認内容設定", href: "/orders/confirm-settings" },
      { label: "区分名称(キャンセル)", href: "/orders/categories/cancel" },
      { label: "区分名称(支払)", href: "/orders/categories/payment" },
      { label: "区分名称(発送)", href: "/orders/categories/shipping" },
      { label: "伝票受注番号", href: "/orders/numbering" },
      { label: "一括注文完了", href: "/orders/bulk-complete" },
      { label: "一括登録制限", href: "/orders/bulk-limit" },
    ],
  },
  {
    icon: Truck, color: "from-emerald-500 to-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-600",
    name: "出荷管理", items: [
      { label: "出荷一覧", href: "/shipments" },
      { label: "納品書・指示書DL", href: "/shipments/documents" },
      { label: "PDF複数DL", href: "/shipments/pdf-bulk" },
      { label: "検品サポート", href: "/shipments/inspection" },
      { label: "バーコード検品", href: "/shipments/inspection-barcode" },
      { label: "出荷確定処理", href: "/shipments/confirm" },
      { label: "出荷可能設定", href: "/shipments/availability" },
      { label: "出荷実績DL", href: "/shipments/sales-download" },
      { label: "出荷通知DL", href: "/shipments/notification-download" },
      { label: "出荷通知一括登録", href: "/shipments/notification-import" },
      { label: "指示書テンプレート", href: "/shipments/instruction-template" },
      { label: "納品書テンプレート", href: "/shipments/delivery-note-template" },
      { label: "配送番号反映", href: "/shipments/tracking" },
      { label: "配送番号サポート", href: "/shipments/tracking-support" },
      { label: "配送ステータスDL", href: "/shipments/status-download" },
      { label: "配送情報DL", href: "/shipments/info-download" },
      { label: "発送完了報告", href: "/shipments/completion-report" },
      { label: "欠品処理", href: "/shipments/shortage" },
      { label: "不良品振替", href: "/shipments/defective" },
      { label: "不良欠品処理", href: "/shipments/defective-shortage" },
    ],
  },
  {
    icon: Tag, color: "from-purple-500 to-purple-400", bg: "bg-purple-500/10", text: "text-purple-600",
    name: "商品管理", items: [
      { label: "商品一覧", href: "/products" },
      { label: "商品登録", href: "/products/new" },
      { label: "セット商品", href: "/products/sets" },
      { label: "セット新規作成", href: "/products/sets/new" },
      { label: "商品一括登録", href: "/products/import" },
      { label: "モール商品一括登録", href: "/products/mall-import" },
      { label: "マスタ全件DL", href: "/products/master-download" },
      { label: "コード紐づけ", href: "/products/code-mapping" },
      { label: "カテゴリ管理", href: "/products/categories" },
      { label: "カテゴリ変換", href: "/products/category-mapping" },
      { label: "納期区分", href: "/products/delivery-period" },
      { label: "独自タグ", href: "/products/tags" },
    ],
  },
  {
    icon: Package, color: "from-orange-500 to-orange-400", bg: "bg-orange-500/10", text: "text-orange-600",
    name: "在庫管理", items: [
      { label: "在庫管理", href: "/products/inventory" },
      { label: "在庫変動履歴", href: "/products/inventory/history" },
      { label: "在庫連携確認", href: "/products/inventory/check" },
      { label: "拠点と店舗連携", href: "/products/inventory/warehouse-link" },
      { label: "引当パターン", href: "/products/inventory/allocation-pattern" },
      { label: "在庫振り分け", href: "/products/allocation" },
      { label: "棚卸", href: "/products/stocktaking" },
    ],
  },
  {
    icon: Users, color: "from-cyan-500 to-cyan-400", bg: "bg-cyan-500/10", text: "text-cyan-600",
    name: "顧客管理", items: [
      { label: "顧客一覧", href: "/customers" },
      { label: "顧客登録", href: "/customers/new" },
      { label: "卸先マスタ", href: "/customers/wholesale" },
      { label: "卸先一括登録", href: "/customers/wholesale/import" },
      { label: "ブラックリスト", href: "/customers/blacklist" },
      { label: "購入回数設定", href: "/customers/purchase-count" },
    ],
  },
  {
    icon: CreditCard, color: "from-yellow-500 to-yellow-400", bg: "bg-yellow-500/10", text: "text-yellow-600",
    name: "入金・決済", items: [
      { label: "入金管理", href: "/payments" },
      { label: "入金登録", href: "/payments/register" },
      { label: "一括入金処理", href: "/payments/bulk" },
      { label: "詳細検索", href: "/payments/details" },
      { label: "入金確認メール", href: "/payments/email-confirm" },
      { label: "金額不整合", href: "/payments/mismatch" },
      { label: "楽天カード確定", href: "/payments/rakuten-card" },
      { label: "Yahoo入金処理", href: "/payments/yahoo" },
      { label: "Yahooかんたん", href: "/payments/yahoo-easy" },
      { label: "NP後払い", href: "/payments/np" },
      { label: "NPコネクト", href: "/payments/np/connect" },
      { label: "後払い.com", href: "/payments/atone" },
    ],
  },
  {
    icon: ClipboardList, color: "from-pink-500 to-pink-400", bg: "bg-pink-500/10", text: "text-pink-600",
    name: "発注・仕入", items: [
      { label: "発注伝票", href: "/purchasing" },
      { label: "発注計算", href: "/purchasing/calculate" },
      { label: "発注書DL", href: "/purchasing/order-download" },
      { label: "発注書テンプレート", href: "/purchasing/order-template" },
      { label: "仕入伝票", href: "/purchasing/invoices" },
      { label: "仕入先マスタ", href: "/purchasing/suppliers" },
      { label: "仕入先一括登録", href: "/purchasing/suppliers/import" },
      { label: "返品管理", href: "/purchasing/returns" },
    ],
  },
  {
    icon: Mail, color: "from-indigo-500 to-indigo-400", bg: "bg-indigo-500/10", text: "text-indigo-600",
    name: "メール", items: [
      { label: "メール管理", href: "/mail" },
      { label: "サーバ設定", href: "/mail/server" },
      { label: "署名設定", href: "/mail/signature" },
      { label: "フリーメールテンプレート", href: "/mail/free-template" },
      { label: "自動送信設定", href: "/mail/auto" },
      { label: "自動送信テンプレート", href: "/mail/auto-template" },
      { label: "送信時間", href: "/mail/schedule" },
    ],
  },
  {
    icon: BarChart3, color: "from-teal-500 to-teal-400", bg: "bg-teal-500/10", text: "text-teal-600",
    name: "分析", items: [
      { label: "分析ダッシュボード", href: "/analytics" },
      { label: "売上情報", href: "/analytics/sales" },
      { label: "商品情報", href: "/analytics/products" },
      { label: "CSVダウンロード", href: "/analytics/csv-download" },
    ],
  },
  {
    icon: LinkIcon, color: "from-sky-500 to-sky-400", bg: "bg-sky-500/10", text: "text-sky-600",
    name: "倉庫連携", items: [
      { label: "ロジザード", href: "/warehouse-integration/logizard" },
      { label: "Yahoo!ロジ", href: "/warehouse-integration/yahoo-logi" },
      { label: "楽天スーパーロジ", href: "/warehouse-integration/rakuten-super-logi" },
      { label: "RSL 入荷処理", href: "/warehouse-integration/rakuten-super-logi/inbound" },
      { label: "RSL 出荷処理", href: "/warehouse-integration/rakuten-super-logi/outbound" },
      { label: "RSL 返品処理", href: "/warehouse-integration/rakuten-super-logi/return" },
      { label: "RSL SKUマッピング", href: "/warehouse-integration/rakuten-super-logi/setup" },
      { label: "RSL 全在庫", href: "/warehouse-integration/rakuten-super-logi/all-stock" },
      { label: "RSL 処理状況", href: "/warehouse-integration/rakuten-super-logi/process-status" },
    ],
  },
  {
    icon: Settings, color: "from-gray-500 to-gray-400", bg: "bg-gray-500/10", text: "text-gray-600",
    name: "設定", items: [
      { label: "企業設定", href: "/settings" },
      { label: "店舗設定", href: "/settings/shops" },
      { label: "担当者・権限", href: "/settings/users" },
      { label: "権限グループ", href: "/settings/permissions" },
      { label: "拠点管理", href: "/settings/warehouses" },
      { label: "受注設定", href: "/settings/order-rules" },
      { label: "テンプレート", href: "/settings/templates" },
      { label: "自動実行処理", href: "/settings/automation" },
      { label: "支払メッセージ", href: "/settings/payment-message" },
      { label: "支払発送変換", href: "/settings/payment-shipping-conversion" },
      { label: "日付自動登録", href: "/settings/date-auto" },
      { label: "除外地域", href: "/settings/excluded-areas" },
      { label: "項目変換", href: "/settings/field-conversion" },
      { label: "マスタ削除", href: "/settings/master-delete" },
      { label: "ダウンロード履歴", href: "/settings/download-history" },
      { label: "API設定", href: "/settings/api" },
    ],
  },
  {
    icon: Bot, color: "from-violet-500 to-purple-400", bg: "bg-violet-500/10", text: "text-violet-600",
    name: "AIエージェント", items: [
      { label: "在庫エージェント", href: "/settings" },
      { label: "受注エージェント", href: "/settings" },
      { label: "価格エージェント", href: "/settings" },
      { label: "CSエージェント", href: "/settings" },
      { label: "分析エージェント", href: "/settings" },
      { label: "出荷エージェント", href: "/settings" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">機能一覧</h1>
        <p className="text-sm text-gray-500 mt-1">このシステムで利用できる全機能の一覧です</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {categories.map(cat => (
          <GlassCard key={cat.name} className="hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2.5 rounded-xl", cat.bg)}>
                <cat.icon className={cn("h-5 w-5", cat.text)} />
              </div>
              <h2 className="font-semibold text-gray-800">{cat.name}</h2>
            </div>
            <div className="space-y-1">
              {cat.items.map(item => (
                <Link key={item.label} href={item.href} className="block px-2 py-1 rounded-lg text-xs text-gray-600 hover:text-blue-600 hover:bg-white/60 transition-all">
                  {item.label}
                </Link>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
