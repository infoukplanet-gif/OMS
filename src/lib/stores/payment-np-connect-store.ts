/**
 * NPコネクト設定 共有マスタストア（single-config 1-record パターン）。
 *
 * payments/np/connect ページの API接続情報（マーチャントID/APIキー/エンドポイント/
 * 環境/標準与信限度額）と業務ルール（自動与信チェック/NG時通知/NG時自動切替）を
 * id 固定の 1 レコードとして createMasterStore に載せ、リロード後も復元する。
 *
 * 永続化（domain: "payment-np-connect-settings"）の正規オーナーページは
 * src/app/payments/np/connect/page.tsx。
 *
 * 注意: ここで持つのはページが既に編集している接続情報のみ。新しい秘匿フィールドは追加しない。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";

export interface PaymentNpConnectFields {
  merchantId: string;
  apiKey: string;
  endpoint: string;
  environment: "production" | "sandbox";
  creditLimit: number;
  autoCheckCredit: boolean;
  autoNotifyMethod: boolean;
  autoSwitchOnNg: boolean;
}

export interface PaymentNpConnectRecord extends PaymentNpConnectFields {
  id: string;
  [extra: string]: unknown;
}

export const DEFAULT_PAYMENT_NP_CONNECT: PaymentNpConnectFields = {
  merchantId: "MID-12345",
  apiKey: "***********",
  endpoint: "https://api.netprotections.com/v2",
  environment: "production",
  creditLimit: 55000,
  autoCheckCredit: true,
  autoNotifyMethod: true,
  autoSwitchOnNg: false,
};

export const INITIAL_PAYMENT_NP_CONNECT: PaymentNpConnectRecord[] = [
  { id: "config", ...DEFAULT_PAYMENT_NP_CONNECT },
];

export const paymentNpConnectStore: MasterStore<PaymentNpConnectRecord> =
  createMasterStore<PaymentNpConnectRecord>(INITIAL_PAYMENT_NP_CONNECT);
