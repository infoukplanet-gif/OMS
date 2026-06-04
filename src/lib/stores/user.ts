/**
 * ユーザー（担当者）マスタの共有ストア（クライアントセッション内シングルトン）。
 *
 * 担当者一覧/登録ページがここに書き込む。id が一意キー。
 */

import { createMasterStore, type MasterRecord } from "./create-master-store";

export interface UserRecord extends MasterRecord {
  id: string;
  name: string;
  email: string;
  role: "オーナー" | "管理者" | "メンバー";
  group: string;
  dept: string;
  shops: number;
  lastLogin: string;
  active: boolean;
  invited: boolean;
}

export const INITIAL_USERS: UserRecord[] = [
  { id: "U001", name: "大野 勇樹", email: "ohno@example.com", role: "オーナー", group: "管理者", dept: "経営", shops: 5, lastLogin: "2026/04/13 18:00", active: true, invited: false },
  { id: "U002", name: "田中 明", email: "tanaka@example.com", role: "管理者", group: "倉庫スタッフ", dept: "物流部", shops: 3, lastLogin: "2026/04/13 17:30", active: true, invited: false },
  { id: "U003", name: "佐藤 花子", email: "sato@example.com", role: "メンバー", group: "CS担当", dept: "CS部", shops: 5, lastLogin: "2026/04/13 16:00", active: true, invited: false },
  { id: "U004", name: "鈴木 直子", email: "suzuki@example.com", role: "メンバー", group: "経理担当", dept: "経理部", shops: 5, lastLogin: "2026/04/11 12:00", active: false, invited: false },
  { id: "U005", name: "山田 太郎", email: "yamada@example.com", role: "メンバー", group: "倉庫スタッフ", dept: "物流部", shops: 1, lastLogin: "—", active: true, invited: true },
];

export const userStore = createMasterStore<UserRecord>(INITIAL_USERS);
