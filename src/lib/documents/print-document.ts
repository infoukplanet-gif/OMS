/**
 * 帳票 HTML 文字列を新規ウィンドウで開き、ブラウザの印刷ダイアログを起動する
 * クライアント専用ヘルパー（PDF保存はブラウザの「PDFに保存」を利用）。
 *
 * renderPurchaseOrderHtml などが生成した standalone HTML をそのまま渡す。
 * window を触るためサーバーでは何もしない（呼び出し側はクリックハンドラから使う）。
 */

/** 印刷ウィンドウを開けたかどうか。ポップアップブロック時は false。 */
export function printDocumentHtml(html: string, windowTitle?: string): boolean {
  if (typeof window === "undefined") return false;

  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
  if (!win) return false;

  win.document.open();
  win.document.write(html);
  win.document.close();
  if (windowTitle) win.document.title = windowTitle;

  // 画像やフォントの読み込みを待ってから印刷ダイアログを起動する。
  const triggerPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === "complete") {
    triggerPrint();
  } else {
    win.addEventListener("load", triggerPrint);
  }
  return true;
}
