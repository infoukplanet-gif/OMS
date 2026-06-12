/**
 * メール送信ログ 共有ストア v1
 *
 * - module スコープ singleton + useSyncExternalStore でページ横断共有
 * - register は id で重複抑止（自動キュー同期の冪等性を担保）
 * - 状態遷移は state-machines/mail の transitionMail 経由のみ
 * - 永続化（domain: "mails"）の正規オーナーページは src/app/mail/page.tsx
 */

import {
  transitionMail,
  type MailAction,
  type MailRecord,
} from "../state-machines/mail";

export interface MailRegisterResult {
  applied: boolean;
  duplicate: boolean;
}

export interface MailTransitionResult {
  applied: boolean;
  record: MailRecord | null;
}

/** 編集モーダルで触ってよい表示フィールドのみ patch 可能にする */
export type MailPatch = Partial<
  Pick<MailRecord, "to" | "subject" | "body" | "scheduled" | "priority">
>;

export interface MailStore {
  getState(): MailRecord[];
  register(record: MailRecord): MailRegisterResult;
  applyTransition(id: string, action: MailAction, now?: string): MailTransitionResult;
  patch(id: string, patch: MailPatch): boolean;
  setItems(items: MailRecord[]): void;
  subscribe(listener: () => void): () => void;
}

export function createMailStore(initial: MailRecord[] = []): MailStore {
  let items: MailRecord[] = [...initial];
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
    applyTransition(id, action, now) {
      const index = items.findIndex((r) => r.id === id);
      if (index < 0) return { applied: false, record: null };

      const current = items[index];
      const next = transitionMail(current, action, now);
      if (next === current) return { applied: false, record: current };

      items = items.map((r, i) => (i === index ? next : r));
      notify();
      return { applied: true, record: next };
    },
    patch(id, patch) {
      const index = items.findIndex((r) => r.id === id);
      if (index < 0) return false;

      items = items.map((r, i) => (i === index ? { ...r, ...patch } : r));
      notify();
      return true;
    },
    setItems(next) {
      items = [...next];
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** クライアントセッション内で共有される単一の MailStore インスタンス */
export const mailStore: MailStore = createMailStore();
