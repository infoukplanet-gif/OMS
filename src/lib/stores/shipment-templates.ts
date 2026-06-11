/**
 * 出荷指示書・納品書テンプレートの共有ストア（セッション内シングルトン）。
 *
 * instructionTemplateStore: shipments/instruction-template ページが読み書きし、
 *   出荷一覧の「出荷指示書発行モーダル」がテンプレート選択肢として参照する。
 *
 * deliveryNoteTemplateStore: shipments/delivery-note-template ページが読み書きし、
 *   出荷一覧の「納品書発行モーダル」がテンプレート選択肢として参照する。
 */

import { createMasterStore } from "@/lib/stores/create-master-store";
import {
  INITIAL_INSTRUCTION_TEMPLATES,
  INITIAL_DELIVERY_NOTE_TEMPLATES,
  type ShipmentInstructionTemplate,
  type DeliveryNoteTemplate,
} from "@/lib/seeds/shipment-templates";

export type { ShipmentInstructionTemplate, DeliveryNoteTemplate } from "@/lib/seeds/shipment-templates";

/** クライアントセッション内で共有される出荷指示書テンプレートのシングルトン。 */
export const instructionTemplateStore =
  createMasterStore<ShipmentInstructionTemplate>(INITIAL_INSTRUCTION_TEMPLATES);

/** クライアントセッション内で共有される納品書テンプレートのシングルトン。 */
export const deliveryNoteTemplateStore =
  createMasterStore<DeliveryNoteTemplate>(INITIAL_DELIVERY_NOTE_TEMPLATES);
