"use client";

/**
 * 出荷指示書発行モーダル。
 *
 * 出荷レコード（ShipmentInstructionSource）と「出荷 > 出荷指示書テンプレート設定」で
 * 管理する帳票テンプレート（instructionTemplateStore）を組み合わせ、実際の出荷指示書
 * レイアウトを iframe プレビューで表示する。
 *
 * 有効（active）なテンプレートのみ選択肢に出す。発行＝印刷/PDF保存（window.print）。
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Printer, FileText } from "lucide-react";
import { instructionTemplateStore, type ShipmentInstructionTemplate } from "@/lib/stores/shipment-templates";
import { INITIAL_INSTRUCTION_TEMPLATES } from "@/lib/seeds/shipment-templates";
import {
  buildShipmentInstructionDocument,
  type ShipmentInstructionSource,
  type ShipmentInstructionTemplateConfig,
} from "@/lib/documents/shipment-instruction-document";
import { renderShipmentInstructionHtml } from "@/lib/documents/shipment-instruction-html";
import { printDocumentHtml } from "@/lib/documents/print-document";
import { COMPANY_ISSUER } from "@/lib/seeds/company";

function toConfig(t: ShipmentInstructionTemplate): ShipmentInstructionTemplateConfig {
  return {
    paperSize: t.paperSize === "ピッキングリスト形式" ? "A4縦" : t.paperSize,
    showBarcode: t.showBarcode,
    showLocation: t.showLocation,
    showLot: t.showLot,
    showSetSplit: t.showSetSplit,
    forWarehouse: t.forWarehouse,
  };
}

interface ShipmentInstructionIssueModalProps {
  open: boolean;
  onClose: () => void;
  source: ShipmentInstructionSource | null;
}

export function ShipmentInstructionIssueModal({
  open,
  onClose,
  source,
}: ShipmentInstructionIssueModalProps) {
  const toast = useToast();

  const templates = useSyncExternalStore(
    (cb) => instructionTemplateStore.subscribe(cb),
    () => instructionTemplateStore.getState(),
    () => INITIAL_INSTRUCTION_TEMPLATES,
  ) as ReadonlyArray<ShipmentInstructionTemplate>;

  const activeTemplates = useMemo(() => templates.filter((t) => t.active), [templates]);

  const [selectedId, setSelectedId] = useState<string>("");

  const selected =
    activeTemplates.find((t) => t.id === selectedId) ?? activeTemplates[0] ?? null;

  const html = useMemo(() => {
    if (!source || !selected) return "";
    const doc = buildShipmentInstructionDocument(source, toConfig(selected));
    return renderShipmentInstructionHtml(doc, COMPANY_ISSUER);
  }, [source, selected]);

  function handlePrint() {
    if (!html || !source) return;
    const ok = printDocumentHtml(html, `${source.id} 出荷指示書`);
    if (!ok) {
      toast.show("ポップアップがブロックされました。ブラウザの設定を確認してください", "error");
      return;
    }
    toast.show(`${source.id} の出荷指示書を発行しました`, "success");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={source ? `出荷指示書発行 — ${source.id}` : "出荷指示書発行"}
      size="lg"
      footer={
        <>
          <SecondaryButton onClick={onClose}>閉じる</SecondaryButton>
          <PrimaryButton onClick={handlePrint} disabled={!html}>
            <span className="inline-flex items-center gap-1.5">
              <Printer className="h-4 w-4" />
              印刷 / PDF保存
            </span>
          </PrimaryButton>
        </>
      }
    >
      {!source ? (
        <p className="text-sm text-gray-500">出荷レコードが選択されていません。</p>
      ) : activeTemplates.length === 0 ? (
        <div className="flex items-start gap-2 text-sm text-amber-700">
          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            有効な出荷指示書テンプレートがありません。「出荷指示書テンプレート設定」で
            テンプレートを有効化してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600">帳票テンプレート</label>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.forWarehouse}・{t.paperSize}）
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white/60 bg-white overflow-hidden shadow-inner">
            <iframe
              title="出荷指示書プレビュー"
              srcDoc={html}
              className="w-full h-[55vh] border-0 bg-white"
            />
          </div>
          <p className="text-xs text-gray-400">
            プレビューと印刷結果は同一レイアウトです。「印刷 / PDF保存」からブラウザの
            印刷ダイアログでPDF保存できます。
          </p>
        </div>
      )}
    </Modal>
  );
}
