/**
 * 自動送信メールテンプレート 共有マスタストア（collection パターン）。
 *
 * mail/auto-template ページがテンプレート（件名・本文・トリガー・有効フラグ等）を
 * id をキーにした複数レコードとして管理し、リロード後も復元する。
 * 保存・新規追加はオーナーページが store.upsert で永続化する。
 *
 * 永続化（domain: "mail-auto-template-settings"）の正規オーナーページは
 * src/app/mail/auto-template/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface MailAutoTemplateRecord {
  id: string;
  name: string;
  trigger: string;
  subject: string;
  body: string;
  updated: string;
  uses: number;
  enabled: boolean;
  [extra: string]: unknown;
}

export const INITIAL_MAIL_AUTO_TEMPLATES: MailAutoTemplateRecord[] = [
  {
    id: "tpl-thanks",
    name: "サンクスメール（受注確認）",
    trigger: "受注確認後 即時",
    subject: "{{shop_name}}：ご注文ありがとうございます（{{order_id}}）",
    body: `{{customer_name}} 様

この度は {{shop_name}} をご利用いただき、誠にありがとうございます。
ご注文を承りましたので、以下の通りご確認ください。

■ 注文番号：{{order_id}}
■ ご注文日：{{order_date}}
■ お支払方法：{{payment_method}}
■ 合計金額：{{total_amount}} 円

商品の発送が完了次第、改めてお知らせいたします。`,
    updated: "2026/04/15",
    uses: 1245,
    enabled: true,
  },
  {
    id: "tpl-ship",
    name: "出荷通知メール",
    trigger: "出荷登録後 即時",
    subject: "{{shop_name}}：商品を発送いたしました（{{order_id}}）",
    body: `{{customer_name}} 様

ご注文いただきました商品を発送いたしました。

■ 注文番号：{{order_id}}
■ 配送業者：{{shipping_carrier}}
■ お問い合わせ番号：{{tracking_number}}
■ お届け予定日：{{delivery_date}}`,
    updated: "2026/04/12",
    uses: 980,
    enabled: true,
  },
  {
    id: "tpl-payment3",
    name: "入金催促（3日経過）",
    trigger: "入金待ち3日後 09:00",
    subject: "【お支払いのお願い】{{shop_name}} ご注文 {{order_id}}",
    body: `{{customer_name}} 様

ご注文の {{order_id}} につきまして、ご入金がまだ確認できておりません。
お支払期限：{{payment_deadline}}`,
    updated: "2026/04/10",
    uses: 312,
    enabled: true,
  },
  {
    id: "tpl-follow",
    name: "フォローアップ（発送後3日）",
    trigger: "発送後3日後 10:00",
    subject: "{{shop_name}}：商品はお手元に届きましたか？",
    body: `{{customer_name}} 様

先日ご注文いただいた商品はお手元に届きましたでしょうか。
万が一、未着・破損などございましたらお知らせください。`,
    updated: "2026/04/08",
    uses: 580,
    enabled: true,
  },
  {
    id: "tpl-reship",
    name: "再発送のお知らせ",
    trigger: "再発送登録後 即時",
    subject: "{{shop_name}}：再発送のお知らせ（{{order_id}}）",
    body: `{{customer_name}} 様

ご迷惑をおかけしております。
{{order_id}} の商品を再発送いたしました。

■ 配送業者：{{shipping_carrier}}
■ お問い合わせ番号：{{tracking_number}}`,
    updated: "2026/04/05",
    uses: 32,
    enabled: true,
  },
  {
    id: "tpl-stock",
    name: "在庫切れ連絡",
    trigger: "在庫不足検知後 即時",
    subject: "{{shop_name}}：商品在庫に関するお知らせ",
    body: `{{customer_name}} 様

ご注文 {{order_id}} につきまして、現在在庫切れが発生しております。
ご希望の対応をお選びください。`,
    updated: "2026/03/30",
    uses: 18,
    enabled: false,
  },
  {
    id: "tpl-review",
    name: "レビュー依頼",
    trigger: "発送後7日後 19:00",
    subject: "{{shop_name}}：レビューのお願い",
    body: `{{customer_name}} 様

商品の使い心地はいかがでしょうか。
ぜひレビューをお寄せください。`,
    updated: "2026/03/28",
    uses: 220,
    enabled: false,
  },
];

export const mailAutoTemplateStore: MasterStore<MailAutoTemplateRecord> =
  createMasterStore<MailAutoTemplateRecord>(INITIAL_MAIL_AUTO_TEMPLATES);
