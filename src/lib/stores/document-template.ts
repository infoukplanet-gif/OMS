/**
 * 帳票テンプレート（発注書フォーマット）の共有ストア（セッション内シングルトン）。
 *
 * 「設定 > 発注書テンプレート設定」(purchasing/order-template) が読み書きし、
 * 発注書発行モーダルと発注書ダウンロード(purchasing/order-download)の
 * テンプレート選択肢が同一インスタンスを購読する。id を一意キーとする。
 *
 * テストは createMasterStore<DocumentTemplate>(...) を直接生成する。
 */

import { createMasterStore } from "@/lib/stores/create-master-store";
import {
  INITIAL_DOCUMENT_TEMPLATES,
  type DocumentTemplate,
} from "@/lib/seeds/document-templates";

export type { DocumentTemplate } from "@/lib/seeds/document-templates";

/** クライアントセッション内で共有される帳票テンプレートのシングルトン。 */
export const documentTemplateStore =
  createMasterStore<DocumentTemplate>(INITIAL_DOCUMENT_TEMPLATES);
