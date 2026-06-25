/**
 * フリーメールテンプレート 共有マスタストア（collection パターン）。
 *
 * mail/free-template ページが手動送信用テンプレート（件名・本文・カテゴリ・
 * 共有設定等）を id をキーにした複数レコードとして管理し、リロード後も復元する。
 * 追加・複製・編集保存は store.upsert、削除は store.remove で永続化する。
 *
 * 永続化（domain: "mail-free-template-settings"）の正規オーナーページは
 * src/app/mail/free-template/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailFreeTemplateRecord {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  signature: string;
  shared: boolean;
  updated: string;
  createdBy: string;
  uses: number;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_FREE_TEMPLATES: MailFreeTemplateRecord[] = [
  {
    id: "free-apology",
    name: "お詫び（発送遅延）",
    category: "お詫び",
    subject: "【お詫び】商品発送遅延について（{{order_id}}）",
    body: "{{customer_name}} 様\n\nこの度はご注文の商品発送が遅延しておりますこと、深くお詫び申し上げます。\n発送見込み日：{{ship_eta}}",
    signature: "default",
    shared: true,
    updated: "2026/04/20",
    createdBy: "山田",
    uses: 45,
  },
  {
    id: "free-stockout",
    name: "在庫切れご連絡",
    category: "問い合わせ",
    subject: "【ご連絡】在庫切れのお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\nご注文いただきました商品が在庫切れとなりました。\n以下より対応をお選びください。",
    signature: "default",
    shared: true,
    updated: "2026/04/15",
    createdBy: "佐藤",
    uses: 18,
  },
  {
    id: "free-cancel",
    name: "キャンセル受付",
    category: "事務連絡",
    subject: "【受付】キャンセル受付完了のお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\nご注文のキャンセルを承りました。",
    signature: "default",
    shared: true,
    updated: "2026/04/10",
    createdBy: "田中",
    uses: 24,
  },
  {
    id: "free-return",
    name: "返品受付",
    category: "事務連絡",
    subject: "【受付】返品受付のお知らせ（{{order_id}}）",
    body: "{{customer_name}} 様\n\n返品の受付を承りました。\n返送先：{{return_address}}",
    signature: "default",
    shared: true,
    updated: "2026/04/05",
    createdBy: "鈴木",
    uses: 32,
  },
  {
    id: "free-vip",
    name: "VIP顧客挨拶",
    category: "営業",
    subject: "{{customer_name}} 様、いつもありがとうございます",
    body: "いつも {{shop_name}} をご利用いただきありがとうございます。",
    signature: "vip",
    shared: false,
    updated: "2026/03/28",
    createdBy: "山田",
    uses: 12,
  },
  {
    id: "free-survey",
    name: "アンケート依頼",
    category: "営業",
    subject: "アンケートご協力のお願い（{{shop_name}}）",
    body: "{{customer_name}} 様\n\n商品改善のためアンケートにご協力ください。",
    signature: "default",
    shared: true,
    updated: "2026/03/20",
    createdBy: "佐藤",
    uses: 88,
  },
];

export const mailFreeTemplateStore: MasterStore<MailFreeTemplateRecord> =
  createMasterStore<MailFreeTemplateRecord>(INITIAL_MAIL_FREE_TEMPLATES);
