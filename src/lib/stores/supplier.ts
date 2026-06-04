/**
 * 仕入先マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 仕入先一覧・仕入先登録フォームが同一インスタンスを読み書きし、
 * 登録した仕入先が即座に一覧に反映される。
 * id = 仕入先コード（SUP-XXX）を一意キーとする。
 */

import { createMasterStore } from "@/lib/stores/create-master-store";

export interface SupplierRecord {
  /** 仕入先コード（一意キー）。 */
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  monthVolume: number;
  ytdVolume: number;
  unpaid: number;
  leadTime: number;
  rating: "A" | "B" | "C";
  status: "取引中" | "停止中" | "新規";
  [extra: string]: unknown;
}

export const INITIAL_SUPPLIERS: SupplierRecord[] = [
  { id: "SUP-001", code: "SUP-001", name: "株式会社ABC電子", contact: "佐藤一郎", phone: "03-1234-5678", email: "sato@abc-elec.co.jp", monthVolume: 1284000, ytdVolume: 18420000, unpaid: 245000, leadTime: 7, rating: "A", status: "取引中" },
  { id: "SUP-002", code: "SUP-002", name: "グローバルパーツ合同会社", contact: "田中明", phone: "06-2345-6789", email: "tanaka@globalparts.jp", monthVolume: 248000, ytdVolume: 4280000, unpaid: 128000, leadTime: 14, rating: "B", status: "取引中" },
  { id: "SUP-003", code: "SUP-003", name: "株式会社ケーブルワークス", contact: "鈴木直子", phone: "045-3456-7890", email: "suzuki@cableworks.jp", monthVolume: 56000, ytdVolume: 1840000, unpaid: 0, leadTime: 5, rating: "A", status: "取引中" },
  { id: "SUP-004", code: "SUP-004", name: "アジアサプライ株式会社", contact: "高橋裕", phone: "03-4567-8901", email: "takahashi@asiasupply.co.jp", monthVolume: 0, ytdVolume: 1240000, unpaid: 84000, leadTime: 30, rating: "C", status: "停止中" },
  { id: "SUP-005", code: "SUP-005", name: "株式会社東京物流", contact: "中村健太", phone: "03-5678-9012", email: "nakamura@tokyologi.co.jp", monthVolume: 0, ytdVolume: 0, unpaid: 0, leadTime: 3, rating: "A", status: "新規" },
];

/** クライアントセッション内で共有される仕入先マスタシングルトン。 */
export const supplierStore = createMasterStore<SupplierRecord>(INITIAL_SUPPLIERS);
