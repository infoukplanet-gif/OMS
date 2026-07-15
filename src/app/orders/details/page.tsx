"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { orderStore, type OrderRecord } from "@/lib/stores/orders";
import {
  transitionOrder,
  orderStatusBadge,
  type OrderStatus,
  type OrderAction,
} from "@/lib/state-machines/order";
import { INITIAL_ORDERS } from "@/lib/seeds/orders";
import { mailQueue } from "@/lib/mail/queue";
import { buildOrderAcknowledgementDocument } from "@/lib/documents/order-acknowledgement-document";
import { renderOrderAcknowledgementHtml } from "@/lib/documents/order-acknowledgement-html";
import { printDocumentHtml } from "@/lib/documents/print-document";
import { COMPANY_ISSUER } from "@/lib/seeds/company";
import { ChevronDown, Printer, MoreHorizontal, Package, MapPin, CreditCard, StickyNote, Copy, X, Trash2, Download, Mail } from "lucide-react";

// 受注明細（単価・数量は数値を単一の真実として持ち、表示は yen() で導出する）。
const orderItems = [
  { name: "ワイヤレスイヤホン Pro", sku: "WEP-001", price: 12800, qty: 2 },
  { name: "USB-Cケーブル 2m", sku: "UCB-002", price: 1280, qty: 3 },
  { name: "保護フィルム セット", sku: "PFS-005", price: 1580, qty: 1 },
];

// 送料（受注詳細の合計計算と帳票で共有）。
const SHIPPING_FEE = 800;

/** 決定的な3桁区切りの円表記（ロケール差を避ける）。 */
function yen(n: number): string {
  return `¥${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

type TimelineEntry = { status: OrderStatus; date: string; by: string };

// 状態を変えるアクションのみ（markInventoryShortage / retryAllocation はバッジ操作なので除外）
const STATUS_ACTIONS: OrderAction[] = [
  "validate",
  "holdForReleaseDate",
  "releaseFromHold",
  "requestPayment",
  "confirmPayment",
  "allocateInventory",
  "markPrinted",
  "registerShipment",
  "revertToPaymentWait",
  "cancel",
];

const ACTION_LABELS: Record<OrderAction, string> = {
  validate: "確認待ちにする",
  holdForReleaseDate: "発売日時待ちにする",
  releaseFromHold: "確認待ちに戻す",
  requestPayment: "入金待ちにする",
  confirmPayment: "入金確認 → 引当待ち",
  allocateInventory: "引当完了 → 印刷待ち",
  markInventoryShortage: "在庫不足にする",
  retryAllocation: "引当を再試行",
  markPrinted: "印刷完了 → 印刷済み",
  registerShipment: "出荷登録 → 出荷済み",
  revertToPaymentWait: "入金待ちに戻す",
  cancel: "受注をキャンセル",
};

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// /orders/details はデモ用の固定URLページ。orderStore の先頭 ID を操作対象に使う。
const DEMO_ORDER_ID = "ORD-2026-08851";

export default function OrderDetailPage() {
  const toast = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // ステータス・履歴は共有 orderStore から購読し、画面横断で一致させる。
  // （ローカル useState では他ページや再訪で消える＝偽装保存になるため）
  const orders = useSyncExternalStore(
    (cb) => orderStore.subscribe(cb),
    () => orderStore.getState(),
    () => INITIAL_ORDERS as readonly OrderRecord[],
  );
  const order = orders.find((o) => o.id === DEMO_ORDER_ID);
  const currentStatus: OrderStatus = (order?.status as OrderStatus) ?? "新規受付";

  const timeline: TimelineEntry[] = Array.isArray(order?.statusHistory)
    ? (order!.statusHistory as TimelineEntry[])
    : order
      ? [
          {
            status: order.status,
            date: typeof order.date === "string" ? order.date : "—",
            by: "システム",
          },
        ]
      : [];

  // SM のガードを単一の真実として、現状態から実行可能な遷移だけを出す。
  const availableActions = order
    ? STATUS_ACTIONS.filter(
        (a) => transitionOrder({ status: currentStatus }, a).status !== currentStatus,
      )
    : [];

  // 既存メモ・追跡番号は orderStore に永続化済み（存在すれば初期表示）
  const [memo, setMemo] = useState<string>(() => {
    const o = orderStore.getState().find((x) => x.id === DEMO_ORDER_ID);
    return typeof o?.memo === "string" ? o.memo : "";
  });
  const [trackingNumber, setTrackingNumber] = useState<string>(() => {
    const o = orderStore.getState().find((x) => x.id === DEMO_ORDER_ID);
    return typeof o?.trackingNumber === "string" ? o.trackingNumber : "";
  });

  // このページに直接アクセスされた場合（orders/page 未訪問）に空ストアを防御的にシードする。
  // 永続オーナー（usePersistentStore）は orders/page 側。ここは in-memory シードのみ。
  useEffect(() => {
    if (orderStore.getState().length === 0) {
      orderStore.setItems(INITIAL_ORDERS);
    }
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function saveMemo() {
    orderStore.patch(DEMO_ORDER_ID, { memo });
    toast.show("メモを保存しました", "success");
  }

  function saveTrackingNumber() {
    const trimmed = trackingNumber.trim();
    orderStore.patch(DEMO_ORDER_ID, { trackingNumber: trimmed });
    toast.show(trimmed ? `追跡番号「${trimmed}」を保存しました` : "追跡番号をクリアしました", "success");
  }

  // ステータス遷移は SM 経由（applyTransition）でのみ更新し、共有ストアに永続化する。
  // applyTransition が返す cross-domain effects（出荷生成・在庫引当・返金等）は、
  // 「ページから他ドメインの state を直接触らない」規約に従い、ここでは意図的に dispatch しない。
  // 連鎖オーケストレーションは orders/page（owner）の責務。
  function changeStatus(action: OrderAction) {
    setStatusOpen(false);
    setMoreOpen(false);
    const result = orderStore.applyTransition(DEMO_ORDER_ID, action);
    if (!result.applied || !result.after) {
      toast.show("この操作は現在のステータスでは実行できません", "info");
      return;
    }
    const prevHistory = Array.isArray(result.before?.statusHistory)
      ? (result.before!.statusHistory as TimelineEntry[])
      : [
          {
            status: (result.before?.status as OrderStatus) ?? "新規受付",
            date: typeof result.before?.date === "string" ? result.before.date : "—",
            by: "システム",
          },
        ];
    const nextHistory: TimelineEntry[] = [
      ...prevHistory,
      { status: result.after.status, date: formatNow(), by: "担当者" },
    ];
    orderStore.patch(DEMO_ORDER_ID, { statusHistory: nextHistory });
    toast.show(`ステータスを「${result.after.status}」に変更しました`, "success");
  }

  // 注文請書（帳票）を standalone HTML として生成し、印刷専用ウィンドウで開く。
  // 画面そのものの window.print() ではなく、印刷に最適化した帳票を出す。
  function handlePrint() {
    const doc = buildOrderAcknowledgementDocument(
      {
        id: DEMO_ORDER_ID,
        customerName: "山田太郎",
        orderDate: timeline[0]?.date && timeline[0].date !== "—" ? timeline[0].date : formatNow().slice(0, 10),
        status: currentStatus,
        shippingFee: SHIPPING_FEE,
        lines: orderItems.map((i) => ({ sku: i.sku, name: i.name, unitPrice: i.price, qty: i.qty })),
      },
      formatNow().slice(0, 10),
    );
    const html = renderOrderAcknowledgementHtml(doc, COMPANY_ISSUER);
    const opened = printDocumentHtml(html, `注文請書 ${DEMO_ORDER_ID}`);
    if (opened) {
      toast.show("注文請書を印刷ウィンドウで開きました", "success");
    } else {
      toast.show("印刷ウィンドウを開けませんでした（ポップアップ許可をご確認ください）", "error");
    }
  }

  // 伝票を複製：共有ストアに新規受注として実際に追加する（own domain）。
  function duplicateOrder() {
    setMoreOpen(false);
    const items = orderStore.getState();
    const source = items.find((o) => o.id === DEMO_ORDER_ID);
    if (!source) {
      toast.show("複製元の受注が見つかりません", "error");
      return;
    }
    let copyId = `${DEMO_ORDER_ID}-COPY`;
    let n = 2;
    while (items.some((o) => o.id === copyId)) {
      copyId = `${DEMO_ORDER_ID}-COPY${n}`;
      n += 1;
    }
    const duplicate: OrderRecord = {
      ...source,
      id: copyId,
      status: "新規受付",
      inventoryShortage: undefined,
      releaseAt: undefined,
      statusHistory: undefined,
    };
    orderStore.setItems([duplicate, ...items]);
    toast.show(`伝票を複製しました（${copyId}）`, "success");
  }

  // 納品書ダウンロード：実際にテキストファイルを生成してダウンロードする（ブラウザのみ）。
  function downloadDeliveryNote() {
    setMoreOpen(false);
    const lines = [
      "納品書",
      `受注番号: ${DEMO_ORDER_ID}`,
      `ステータス: ${currentStatus}`,
      "",
      ["商品名", "SKU", "単価", "数量", "小計"].join("\t"),
      ...orderItems.map((i) => [i.name, i.sku, yen(i.price), String(i.qty), yen(i.price * i.qty)].join("\t")),
      "",
      ["合計", "", "", "", "¥35,002"].join("\t"),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `納品書_${DEMO_ORDER_ID}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show("納品書をダウンロードしました", "success");
  }

  // 確認メール再送：mail ドメインの公開IF（mailQueue）に実際に enqueue する。
  function resendConfirmationMail() {
    setMoreOpen(false);
    const result = mailQueue.enqueueAll([
      { orderId: DEMO_ORDER_ID, triggerType: "thanks", dedupeKey: `${DEMO_ORDER_ID}:thanks` },
    ]);
    if (result.enqueued > 0) {
      toast.show("確認メールを送信キューに追加しました", "success");
    } else if (result.duplicateSkipped > 0) {
      toast.show("確認メールは既に送信キューに存在します", "info");
    } else {
      toast.show("確認メールの自動送信が無効のため送信されませんでした", "info");
    }
  }

  // 受注を削除：共有ストアから実際に除去する（own domain）。
  function deleteOrder() {
    setMoreOpen(false);
    const items = orderStore.getState();
    if (!items.some((o) => o.id === DEMO_ORDER_ID)) {
      toast.show("受注が見つかりません", "error");
      return;
    }
    orderStore.setItems(items.filter((o) => o.id !== DEMO_ORDER_ID));
    toast.show("受注を削除しました", "success");
  }

  if (!order) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs text-gray-500 mb-1">ダッシュボード &gt; 受注一覧 &gt; 受注詳細</p>
          <h1 className="text-2xl font-bold text-gray-800">#{DEMO_ORDER_ID}</h1>
        </div>
        <GlassCard>
          <p className="text-sm text-gray-600">この受注は存在しません（削除済み、または未取得です）。</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div>
        <p className="text-xs text-gray-500 mb-1">ダッシュボード &gt; 受注一覧 &gt; 受注詳細</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">#{DEMO_ORDER_ID}</h1>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors", orderStatusBadge[currentStatus])}>
              {currentStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={statusRef}>
              <button
                type="button"
                onClick={() => { setStatusOpen((v) => !v); setMoreOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-white/60 border border-white/50 text-gray-700 hover:bg-white/80 transition-all"
              >
                ステータス変更 <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", statusOpen && "rotate-180")} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-20">
                  {availableActions.length === 0 ? (
                    <p className="px-3 py-2.5 text-sm text-gray-500">変更可能な遷移はありません</p>
                  ) : (
                    availableActions.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => changeStatus(a)}
                        className="w-full flex items-center px-3 py-2 text-sm text-left text-gray-800 hover:bg-white/60 transition-colors"
                      >
                        {ACTION_LABELS[a]}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
              aria-label="印刷"
            >
              <Printer className="h-4 w-4" />
            </button>

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => { setMoreOpen((v) => !v); setStatusOpen(false); }}
                className="p-2 rounded-xl bg-white/60 border border-white/50 text-gray-600 hover:bg-white/80 transition-all"
                aria-label="その他"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-20">
                  <MenuItem icon={<Copy className="h-4 w-4" />} label="伝票を複製" onClick={duplicateOrder} />
                  <MenuItem icon={<Download className="h-4 w-4" />} label="納品書ダウンロード" onClick={downloadDeliveryNote} />
                  <MenuItem icon={<Mail className="h-4 w-4" />} label="確認メール再送" onClick={resendConfirmationMail} />
                  <MenuItem icon={<X className="h-4 w-4" />} label="受注をキャンセル" onClick={() => changeStatus("cancel")} />
                  <div className="border-t border-white/40" />
                  <MenuItem icon={<Trash2 className="h-4 w-4" />} label="受注を削除" danger onClick={deleteOrder} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 space-y-4">
          <GlassCard>
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" />受注明細</h2>
            <div className="overflow-hidden rounded-xl border border-white/50">
              <table className="w-full text-sm">
                <thead><tr className="bg-white/50">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">商品名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">単価</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">小計</th>
                </tr></thead>
                <tbody>
                  {orderItems.map(i => (
                    <tr key={i.sku} className="border-t border-white/30 hover:bg-white/40">
                      <td className="px-3 py-2.5 font-medium text-gray-800">{i.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{i.sku}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{yen(i.price)}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{i.qty}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800">{yen(i.price * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 space-y-1 text-sm text-right">
              <div className="flex justify-end gap-8"><span className="text-gray-500">小計</span><span className="w-24 text-gray-700">¥31,020</span></div>
              <div className="flex justify-end gap-8"><span className="text-gray-500">送料</span><span className="w-24 text-gray-700">¥800</span></div>
              <div className="flex justify-end gap-8"><span className="text-gray-500">消費税(10%)</span><span className="w-24 text-gray-700">¥3,182</span></div>
              <div className="flex justify-end gap-8 pt-1 border-t border-white/40"><span className="font-medium text-gray-800">合計</span><span className="w-24 font-bold text-gray-800 text-lg">¥35,002</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-base font-semibold text-gray-800 mb-4">ステータス履歴</h2>
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("h-3 w-3 rounded-full", i === timeline.length - 1 ? "bg-blue-500" : "bg-emerald-500")} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-800">{t.status}</p>
                    <p className="text-xs text-gray-500">{t.date} — {t.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-2 space-y-4">
          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />注文者情報</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500 w-16 inline-block">氏名</span><span className="text-gray-800 font-medium">山田太郎</span></div>
              <div><span className="text-gray-500 w-16 inline-block">メール</span><span className="text-gray-700">yamada@example.com</span></div>
              <div><span className="text-gray-500 w-16 inline-block">電話</span><span className="text-gray-700">090-1234-5678</span></div>
              <div><span className="text-gray-500 w-16 inline-block">住所</span><span className="text-gray-700">〒100-0001 東京都千代田区千代田1-1-1</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">配送情報</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500 w-16 inline-block">配送先</span><span className="text-gray-700">注文者と同じ</span></div>
              <div><span className="text-gray-500 w-16 inline-block">配送方法</span><span className="text-gray-700">ヤマト運輸</span></div>
              <div className="pt-2">
                <label className="text-gray-500 text-xs block mb-1">追跡番号</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="追跡番号を入力..."
                    className="flex-1 h-8 px-3 rounded-lg text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={saveTrackingNumber}
                    className="px-3 h-8 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors shrink-0"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />支払情報</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">支払方法</span><span className="text-gray-800">クレジットカード</span></div>
              <div className="flex justify-between"><span className="text-gray-500">支払状態</span><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-700">入金済み</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><StickyNote className="h-4 w-4 text-gray-400" />社内メモ</h3>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力..."
              className="w-full px-3 py-2 rounded-xl text-sm bg-white/50 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 resize-none"
            />
            <button
              type="button"
              onClick={saveMemo}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 transition-colors"
            >
              保存
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/60 transition-colors",
        danger ? "text-red-600" : "text-gray-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
