/**
 * 不良品振替台帳の共有ストア（クライアントセッション内シングルトン）。
 *
 * 仕様: docs/prd/defective-stocktake-cascade-v1.md
 *
 * - shipments/defective が正規オーナー（usePersistentStore で永続化）。
 * - 棚卸（products/stocktaking）の負差異（減耗）が register() で監査記録を積む。
 * - applyTransition() は state-machine transitionDefective を経由（直接 status を書き換えない）。
 * - 通知は実際に台帳が変化した時のみ（重複 register・不正遷移は通知しない）。
 *
 * v1 はブラウザ module スコープでの保持。テストは createDefectiveStore() を直接使う。
 */

import {
  transitionDefective,
  type DefectiveAction,
  type DefectiveRecord,
} from "../state-machines/defective";

export interface RegisterDefectiveResult {
  /** 新規に台帳へ積まれたか。 */
  applied: boolean;
  /** 同一 id が既存で no-op になったか。 */
  duplicate: boolean;
}

export interface TransitionDefectiveResult {
  /** 遷移が成立し台帳が更新されたか。 */
  applied: boolean;
  /** 遷移後（or 対象が見つからなければ null）のレコード。 */
  record: DefectiveRecord | null;
}

export interface DefectiveStore {
  getState(): readonly DefectiveRecord[];
  /** レコードを 1 件追加する。同一 id は二重登録しない。 */
  register(record: DefectiveRecord): RegisterDefectiveResult;
  /** id のレコードに状態遷移を適用する。不正遷移・未存在は applied=false。 */
  applyTransition(id: string, action: DefectiveAction): TransitionDefectiveResult;
  /** 台帳全体を置換する（初期同期用）。 */
  setItems(next: ReadonlyArray<DefectiveRecord>): void;
  subscribe(listener: () => void): () => void;
}

export function createDefectiveStore(
  initial: ReadonlyArray<DefectiveRecord> = [],
): DefectiveStore {
  let items: readonly DefectiveRecord[] = [...initial];
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  return {
    getState() {
      return items;
    },

    register(record) {
      if (items.some((r) => r.id === record.id)) {
        return { applied: false, duplicate: true };
      }
      items = [...items, record];
      notify();
      return { applied: true, duplicate: false };
    },

    applyTransition(id, action) {
      const current = items.find((r) => r.id === id);
      if (!current) return { applied: false, record: null };

      const next = transitionDefective(current, action);
      if (next === current) return { applied: false, record: current };

      items = items.map((r) => (r.id === id ? next : r));
      notify();
      return { applied: true, record: next };
    },

    setItems(next) {
      items = [...next];
      notify();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * クライアントセッション内で共有される単一の DefectiveStore インスタンス。
 * shipments/defective（登録・承認・振替実行）と
 * products/stocktaking（減耗の不良登録）から読み書きされる。
 */
export const defectiveStore: DefectiveStore = createDefectiveStore();
