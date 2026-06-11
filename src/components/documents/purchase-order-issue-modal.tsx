"use client";

/**
 * 発注書発行モーダル。
 *
 * 発注レコード（PurchaseOrderSource）と「設定 > 発注書テンプレート設定」で管理する
 * 帳票テンプレート（documentTemplateStore）を組み合わせ、実際の発注書レイアウトを
 * iframe プレビューで表示する。同じ HTML を印刷ウィンドウにも流すため、プレビューと
 * 印刷結果がズレない。
 *
 * 有効（active）なテンプレートのみ選択肢に出す。発行＝印刷/PDF保存（window.print）。
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { Printer, FileText } from "lucide-react";
import { documentTemplateStore } from "@/lib/stores/document-template";
import { INITIAL_DOCUMENT_TEMPLATES, type DocumentTemplate } from "@/lib/seeds/document-templates";
import {
  buildPurchaseOrderDocument,
  type PurchaseOrderSource,
  type DocumentTemplateConfig,
} from "@/lib/documents/purchase-order-document";
import { renderPurchaseOrderHtml } from "@/lib/documents/purchase-order-html";
import { printDocumentHtml } from "@/lib/documents/print-document";
import { COMPANY_ISSUER } from "@/lib/seeds/company";

function toConfig(t: DocumentTemplate): DocumentTemplateConfig {
  return {
    language: t.language,
    paperSize: t.paperSize,
    showLogo: t.showLogo,
    showInvoice: t.showInvoice,
    showSignature: t.showSignature,
    showTaxBreakdown: t.showTaxBreakdown,
  };
}

interface PurchaseOrderIssueModalProps {
  open: boolean;
  onClose: () => void;
  source: PurchaseOrderSource | null;
}

export function PurchaseOrderIssueModal({ open, onClose, source }: PurchaseOrderIssueModalProps) {
  const toast = useToast();

  const templates = useSyncExternalStore(
    (cb) => documentTemplateStore.subscribe(cb),
    () => documentTemplateStore.getState(),
    () => INITIAL_DOCUMENT_TEMPLATES,
  ) as ReadonlyArray<DocumentTemplate>;

  const activeTemplates = useMemo(() => templates.filter((t) => t.active), [templates]);

  const [selectedId, setSelectedId] = useState<string>("");

  // 選択中テンプレート: 明示選択がなければ先頭の有効テンプレート。
  const selected =
    activeTemplates.find((t) => t.id === selectedId) ?? activeTemplates[0] ?? null;

  const html = useMemo(() => {
    if (!source || !selected) return "";
    const doc = buildPurchaseOrderDocument(source, toConfig(selected));
    return renderPurchaseOrderHtml(doc, COMPANY_ISSUER);
  }, [source, selected]);

  function handlePrint() {
    if (!html || !source) return;
    const ok = printDocumentHtml(html, `${source.id} 発注書`);
    if (!ok) {
      toast.show("ポップアップがブロックされました。ブラウザの設定を確認してください", "error");
      return;
    }
    toast.show(`${source.id} の発注書を発行しました`, "success");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={source ? `発注書発行 — ${source.id}` : "発注書発行"}
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
        <p className="text-sm text-gray-500">発注書が選択されていません。</p>
      ) : activeTemplates.length === 0 ? (
        <div className="flex items-start gap-2 text-sm text-amber-700">
          <FileText className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            有効な発注書テンプレートがありません。「設定 &gt; 発注書テンプレート設定」で
            テンプレートを有効化してください。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* テンプレート選択 */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-gray-600">帳票テンプレート</label>
            <select
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 px-3 rounded-xl text-sm bg-white/70 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.language}・{t.paperSize}）
                </option>
              ))}
            </select>
          </div>

          {/* プレビュー（印刷と同一 HTML） */}
          <div className="rounded-xl border border-white/60 bg-white overflow-hidden shadow-inner">
            <iframe
              title="発注書プレビュー"
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
