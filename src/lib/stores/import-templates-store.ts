/**
 * 取込マッピングテンプレートのストア群。
 *
 * 取込コンテキスト（受注／商品／仕入先／卸先）ごとに独立したストアを持つ。
 * 各取込ページが自分のコンテキストのオーナーで、usePersistentStore で
 * それぞれのドメインへ永続化する（ページ間でストアを共有しない）。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import {
  INITIAL_ORDER_IMPORT_TEMPLATES,
  INITIAL_PRODUCT_IMPORT_TEMPLATES,
  INITIAL_SUPPLIER_IMPORT_TEMPLATES,
  INITIAL_WHOLESALE_IMPORT_TEMPLATES,
  type ImportTemplateRecord,
} from "../seeds/import-templates";

export type { ImportTemplateRecord } from "../seeds/import-templates";

export const orderImportTemplateStore: MasterStore<ImportTemplateRecord> =
  createMasterStore<ImportTemplateRecord>(INITIAL_ORDER_IMPORT_TEMPLATES);

export const productImportTemplateStore: MasterStore<ImportTemplateRecord> =
  createMasterStore<ImportTemplateRecord>(INITIAL_PRODUCT_IMPORT_TEMPLATES);

export const supplierImportTemplateStore: MasterStore<ImportTemplateRecord> =
  createMasterStore<ImportTemplateRecord>(INITIAL_SUPPLIER_IMPORT_TEMPLATES);

export const wholesaleImportTemplateStore: MasterStore<ImportTemplateRecord> =
  createMasterStore<ImportTemplateRecord>(INITIAL_WHOLESALE_IMPORT_TEMPLATES);
