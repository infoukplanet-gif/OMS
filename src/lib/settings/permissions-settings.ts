/**
 * 権限グループ設定のモジュール内シングルトン。
 *
 * - `settings/permissions` ページが書き換える
 * - 担当者フォームで権限グループ一覧を参照する
 * - v1 はブラウザ module スコープでの保持（リロードで初期化）。永続化は v2 で server action + DB
 */

export interface PermissionGroup {
  id: string;
  name: string;
  desc: string;
  users: number;
  isAdmin: boolean;
  /** key: "カテゴリ名-アイテム名", value: true = 制限（使用不可） */
  restricted: Record<string, boolean>;
}

export const DEFAULT_PERMISSION_GROUPS: PermissionGroup[] = [
  { id: "G001", name: "管理者", desc: "全機能にアクセス可能", users: 2, isAdmin: true, restricted: {} },
  { id: "G002", name: "経営者", desc: "全機能の閲覧 + 分析", users: 1, isAdmin: false, restricted: {} },
  { id: "G003", name: "倉庫スタッフ", desc: "出荷・在庫操作", users: 5, isAdmin: false, restricted: {
    "設定メニュー全般-基本": true,
    "設定メニュー全般-その他": true,
    "設定メニュー全般-アプリ": true,
    "発注・仕入メニュー-発注計算": true,
    "分析メニュー全般-売上分析": true,
    "分析メニュー全般-商品分析": true,
    "顧客管理メニュー全般-顧客一覧": true,
  } },
  { id: "G004", name: "CS担当", desc: "受注・顧客対応", users: 3, isAdmin: false, restricted: {
    "設定メニュー全般-基本": true,
    "在庫メニュー-棚卸": true,
    "発注・仕入メニュー-発注伝票検索": true,
    "発注・仕入メニュー-発注計算": true,
  } },
  { id: "G005", name: "経理担当", desc: "入金・請求書発行", users: 2, isAdmin: false, restricted: {
    "在庫メニュー-棚卸": true,
    "出荷メニュー-出荷指示書": true,
    "出荷メニュー-検品サポート": true,
  } },
];

let groups: PermissionGroup[] = DEFAULT_PERMISSION_GROUPS.map((g) => ({
  ...g,
  restricted: { ...g.restricted },
}));

/** グループ一覧のコピーを返す */
export function getPermissionGroups(): PermissionGroup[] {
  return groups.map((g) => ({ ...g, restricted: { ...g.restricted } }));
}

/** 特定グループの restricted マップを上書き */
export function saveGroupPermissions(id: string, restricted: Record<string, boolean>): void {
  groups = groups.map((g) => (g.id === id ? { ...g, restricted: { ...restricted } } : g));
}

/** 新規グループを追加 */
export function addPermissionGroup(group: Omit<PermissionGroup, "restricted">): void {
  groups = [...groups, { ...group, restricted: {} }];
}

/** グループの基本情報を更新（name/desc） */
export function updateGroupInfo(id: string, patch: Pick<PermissionGroup, "name" | "desc">): void {
  groups = groups.map((g) => (g.id === id ? { ...g, ...patch } : g));
}

/** デフォルトに戻す */
export function resetPermissionGroups(): void {
  groups = DEFAULT_PERMISSION_GROUPS.map((g) => ({ ...g, restricted: { ...g.restricted } }));
}
