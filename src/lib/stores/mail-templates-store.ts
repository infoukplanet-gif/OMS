/**
 * メール管理ページのテンプレート一覧 共有マスタストア（collection パターン）。
 *
 * mail（メール管理）ページの「テンプレート」タブで表示・編集する
 * 自動送信／手動テンプレート（件名・本文・トリガー・種別・更新日・送信実績）を
 * id をキーにした複数レコードとして管理し、リロード後も復元する。
 * 編集保存はオーナーページが store.upsert で永続化する。
 *
 * 永続化（domain: "mail-templates"）の正規オーナーページは
 * src/app/mail/page.tsx。
 *
 * 注: 自動送信専用テンプレートは mailAutoTemplateStore（mail/auto-template）、
 * フリーメールテンプレートは mailFreeTemplateStore（mail/free-template）が別ドメインで保持する。
 * 本ストアはメール管理トップ画面の一覧編集だけを担当する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailTemplateRecord {
  id: string;
  name: string;
  type: string;
  trigger: string;
  updated: string;
  uses: number;
  subject: string;
  body: string;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_TEMPLATES: MailTemplateRecord[] = [
  { id: "tpl-thanks", name: "サンクスメール（自動）", type: "自動送信", trigger: "受注確認", updated: "2026/04/01", uses: 1245, subject: "【ご注文ありがとうございます】ORD-XXXX", body: "{{customer_name}} 様\n\nご注文いただきありがとうございます。\nご注文番号：{{order_id}}\n\n発送準備が整い次第ご連絡いたします。" },
  { id: "tpl-ship", name: "出荷通知メール（自動）", type: "自動送信", trigger: "出荷完了", updated: "2026/03/28", uses: 980, subject: "【出荷のお知らせ】{{order_id}}", body: "{{customer_name}} 様\n\nご注文の商品を発送いたしました。\n配送業者：{{shipping_carrier}}\nお問い合わせ番号：{{tracking_number}}\n到着予定：{{delivery_date}}" },
  { id: "tpl-payment", name: "入金確認メール（自動）", type: "自動送信", trigger: "入金待ち3日", updated: "2026/03/25", uses: 312, subject: "【お支払いのお願い】{{order_id}}", body: "{{customer_name}} 様\n\n{{order_id}} のご入金がまだ確認できておりません。\nお支払期限：{{payment_deadline}}\n\nご対応をお願いいたします。" },
  { id: "tpl-delay", name: "発送遅延のお詫び", type: "手動", trigger: "—", updated: "2026/03/20", uses: 45, subject: "【お詫び】発送遅延のご連絡（{{order_id}}）", body: "{{customer_name}} 様\n\nご注文 {{order_id}} につきまして発送が遅延しております。\n大変申し訳ございません。\n発送見込み日：{{ship_eta}}" },
  { id: "tpl-reship", name: "再発送のお知らせ", type: "手動", trigger: "—", updated: "2026/03/15", uses: 32, subject: "【再発送】商品再発送のお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\n{{order_id}} の商品を再発送いたしました。\n配送業者：{{shipping_carrier}}\n到着予定：{{delivery_date}}" },
  { id: "tpl-follow", name: "フォローアップメール", type: "自動送信", trigger: "発送後3日", updated: "2026/03/10", uses: 580, subject: "商品はお手元に届きましたか？（{{order_id}}）", body: "{{customer_name}} 様\n\n商品はお手元に届きましたでしょうか。\n万が一、未着・破損などございましたらご連絡ください。" },
  { id: "tpl-stockout", name: "在庫切れご連絡", type: "手動", trigger: "—", updated: "2026/03/05", uses: 18, subject: "【ご連絡】在庫切れのお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\nご注文いただきました商品が在庫切れとなりました。\nご対応の選択肢をご案内いたします。" },
  { id: "tpl-return", name: "返品受付のお知らせ", type: "手動", trigger: "—", updated: "2026/02/28", uses: 24, subject: "【受付】返品受付完了のお知らせ（{{order_id}}）", body: "{{customer_name}} 様\n\n返品の受付を承りました。\n返送先：{{return_address}}\n\nご対応よろしくお願いいたします。" },
];

export const mailTemplatesStore: MasterStore<MailTemplateRecord> =
  createMasterStore<MailTemplateRecord>(INITIAL_MAIL_TEMPLATES);
