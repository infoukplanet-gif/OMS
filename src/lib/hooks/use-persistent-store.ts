"use client";

/**
 * 共有ストアを server action 経由で永続化する再利用フック。
 *
 * orders/page.tsx で確立した「初回 restore → なければ seed / 変更を debounce snapshot」
 * パターンを 1 箇所に集約し、各ドメインのオーナーページから 1 行で配線できるようにする。
 *
 * 使い方（各ストアの正規オーナーページで 1 回だけ呼ぶ）:
 *   usePersistentStore({ store: inventoryStore, domain: "inventory", seed: INITIAL_INVENTORY });
 *
 * 注意:
 *  - 同一ストアに対して複数ページからこのフックを張ると snapshot 書き込みが二重化する。
 *    各ストアの「正規オーナーページ 1 枚」でのみ呼ぶこと（読み取りだけのページは張らない）。
 *  - DATABASE_URL 未設定時は restore=null / snapshot=no-db となり in-memory seed で動く。
 */

import { useEffect } from "react";
import { restoreDomain, snapshotDomain } from "@/app/_actions/snapshots";
import type { SnapshotDomain } from "@/lib/persistence/snapshot-domain";

interface PersistableStore<T> {
  getState(): readonly T[];
  setItems(next: ReadonlyArray<T>): void;
  subscribe(listener: () => void): () => void;
}

interface UsePersistentStoreOptions<T> {
  store: PersistableStore<T>;
  domain: SnapshotDomain;
  /** restore が空/未接続の時に流し込む初期データ。 */
  seed: ReadonlyArray<T>;
  /** snapshot の debounce（既定 500ms）。 */
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 500;

export function usePersistentStore<T extends object>({
  store,
  domain,
  seed,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UsePersistentStoreOptions<T>): void {
  // 初回 mount: 永続化スナップショットがあれば setItems、なければ（空なら）seed。
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restored = await restoreDomain<T>(domain);
      if (cancelled) return;
      if (restored && restored.length > 0) {
        store.setItems(restored);
      } else if (store.getState().length === 0) {
        store.setItems(seed);
      }
    })();
    return () => {
      cancelled = true;
    };
    // store/domain/seed は mount 時点の参照で固定する（再購読を避ける）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 変更を debounce して server action で snapshot。
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = store.subscribe(() => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        void snapshotDomain(domain, store.getState());
      }, debounceMs);
    });
    return () => {
      if (timer !== null) clearTimeout(timer);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
