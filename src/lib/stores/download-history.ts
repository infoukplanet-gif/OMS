/**
 * ダウンロード履歴 共有ストア（collection パターン）。
 *
 * settings/download-history ページのダウンロードジョブ（カテゴリ/ファイル名/状態 等）を
 * id をキーにした複数レコードとして createMasterStore に載せ、再実行・削除をリロード後も
 * 復元する。
 *
 * 状態遷移は state-machine transitionDownloadJob を経由する
 * （ページで status を直書きしない）。
 *
 * 永続化（domain: "download-history"）の正規オーナーページは
 * src/app/settings/download-history/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { DownloadJobRecord } from "../state-machines/download-job";
import { INITIAL_DOWNLOAD_JOBS } from "../seeds/download-history";

export const downloadHistoryStore: MasterStore<DownloadJobRecord> =
  createMasterStore<DownloadJobRecord>(INITIAL_DOWNLOAD_JOBS);
