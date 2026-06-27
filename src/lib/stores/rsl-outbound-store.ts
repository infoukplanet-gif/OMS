/**
 * RSL 出荷処理キューの共有ストア。
 *
 * 失敗の再送・保留分の即時送信で status が遷移する出荷指示ログを保持する。
 * outbound ページがオーナーで、usePersistentStore で "rsl-outbound" ドメインへ永続化する。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import { INITIAL_RSL_OUTBOUND, type RslOutbound } from "../seeds/rsl-outbound";

export type { RslOutbound, RslOutboundStatus } from "../seeds/rsl-outbound";

export const rslOutboundStore: MasterStore<RslOutbound> =
  createMasterStore<RslOutbound>(INITIAL_RSL_OUTBOUND);
