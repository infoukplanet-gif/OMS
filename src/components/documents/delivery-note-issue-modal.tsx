"use client";

/**
 * 納品書発行モーダル。
 *
 * 出荷レコード（DeliveryNoteSource）と「出荷 > 納品書テンプレート設定」で管理する
 * 帳票テンプレート（deliveryNoteTemplateStore）を組み合わせ、実際の納品書レイアウトを
 * iframe プレビューで表示する。
 *
 * 有効（active）なテンプレートのみ選択肢に出す。発行＝印刷/PDF保存（window.print）。
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Printer, FileText } from "lucide-react";
import { deliveryNoteTemplateStore, type DeliveryNoteTemplate } from "@/lib/stores/shipment-templates";
import { INITIAL_DELIVERY_NOTE_TEMPLATES } from "@/lib/seeds/shipment-templates";
import {
  buildDeliveryNoteDocument,
  type DeliveryNoteSource,
  type DeliveryNoteTemplateConfig,
} from "@/lib/documents/delivery-note-document";
import { renderDeliveryNoteHtml } from "@/lib/documents/delivery-note-html";
import { printDocumentHtml } from "@/lib/documents/print-document";
import { COMPANY_ISSUER } from "@/lib/seeds/company";

function toConfig(t: DeliveryNoteTemplate): DeliveryNoteTemplateConfig {
  return {
    paperSize: t.paperSize,
    forUse: t.forUse,
    showLogo: t.showLogo,
    showInvoice: t.showInvoice,
    showPriceBreakdown: t.showPriceBreakdown,
    showSignature: t.showSignature,
  };
}

interface DeliveryNoteIssueModalProps {
  open: boolean;
  onClose: () => void;
  source: DeliveryNoteSource | null;
}

export function DeliveryNoteIssueModal({
  open,
  onClose,
  source,
}: DeliveryNoteIssueModalProps) {
  const toast = useToast();

  const templates = useSyncExternalStore(
    (cb) => deliveryNoteTemplateStore.subscribe(cb),
    () => deliveryNoteTemplateStore.getState(),
    () => INITIAL_DELIVERY_NOTE_TEMPLATES,
  ) as ReadonlyArray<DeliveryNoteTemplate>;

  const activeTemplates = useMemo(() => templates.filter((t) => t.active), [templates]);

  const [selectedId, setSelectedId] = useState<string>("");

  const selected =
    activeTemplates.find((t) => t.id === selectedId) ?? activeTemplates[0] ?? null;

  const html = useMemo(() => {
    if (!source || !selected) return "";
    const doc = buildDeliveryNoteDocument(source, toConfig(selected));
    return renderDeliveryNoteHtml(doc, COMPANY_ISSUER);
  }, [source, selected]);

  function handlePrint() {
    if (!html || !source) return;
    const ok = printDocumentHtml(html, `${source.id} 納品書`);
    if (!ok) {
      toast.show("ポップアップがブロックされました。ブラウザの設定を確認してください", "error");
      return;
    }
    toast.show(`${source.id} の納品書を発行しました`, "success");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={source ? `納品書発行 — ${source.id}` : "納品書発行"}
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
            有効な納品書テンプレートがありません。「納品書テンプレート設定」で
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
                  {t.name}（{t.forUse}・{t.paperSize}）
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white/60 bg-white overflow-hidden shadow-inner">
            <iframe
              title="納品書プレビュー"
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
