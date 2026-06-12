"use client";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Modal, PrimaryButton, SecondaryButton, useToast } from "@/components/ui/interactive";
import { cn } from "@/lib/utils";
import { Info, Link as LinkIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";

type ChannelStatus = "ok" | "warning" | "error";

type Mapping = {
  id: string;
  code: string;
  name: string;
  rakutenNumber: string;
  rakutenSku: string;
  amazonSku: string;
  yahooCode: string;
  yahooSubcode: string;
  shopifySku: string;
  status: ChannelStatus;
};

function computeStatus(m: Omit<Mapping, "id" | "status">): ChannelStatus {
  const filled = [m.rakutenNumber, m.amazonSku, m.yahooCode, m.shopifySku].filter(Boolean).length;
  if (filled === 4) return "ok";
  if (filled === 0) return "error";
  return "warning";
}

const INITIAL_MAPPINGS: Mapping[] = [
  {
    id: "1",
    code: "WEP-001",
    name: "ワイヤレスイヤホン Pro",
    rakutenNumber: "wep-001-r",
    rakutenSku: "",
    amazonSku: "B0WEP001",
    yahooCode: "wep001y",
    yahooSubcode: "",
    shopifySku: "wep-001",
    status: "ok",
  },
  {
    id: "2",
    code: "WEP-001-BK",
    name: "ワイヤレスイヤホン Pro / ブラック",
    rakutenNumber: "wep-001-r",
    rakutenSku: "wep-001-bk",
    amazonSku: "B0WEP001BK",
    yahooCode: "wep001y",
    yahooSubcode: "bk",
    shopifySku: "wep-001-bk",
    status: "ok",
  },
  {
    id: "3",
    code: "UCB-002",
    name: "USB-Cケーブル 2m",
    rakutenNumber: "ucb-002-r",
    rakutenSku: "",
    amazonSku: "B0UCB002",
    yahooCode: "ucb002y",
    yahooSubcode: "",
    shopifySku: "ucb-002",
    status: "ok",
  },
  {
    id: "4",
    code: "MBT-004",
    name: "モバイルバッテリー 20000mAh",
    rakutenNumber: "mbt-004-r",
    rakutenSku: "",
    amazonSku: "B0MBT004",
    yahooCode: "",
    yahooSubcode: "",
    shopifySku: "mbt-004",
    status: "warning",
  },
  {
    id: "5",
    code: "CHG-007",
    name: "急速充電器 65W",
    rakutenNumber: "chg-007-r",
    rakutenSku: "",
    amazonSku: "",
    yahooCode: "chg007y",
    yahooSubcode: "",
    shopifySku: "chg-007",
    status: "warning",
  },
];

const sb: Record<ChannelStatus, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  warning: "bg-yellow-500/15 text-yellow-700",
  error: "bg-red-500/15 text-red-700",
};

const statusLabel: Record<ChannelStatus, string> = {
  ok: "正常",
  warning: "一部未設定",
  error: "未設定",
};

type FormState = {
  code: string;
  name: string;
  rakutenNumber: string;
  rakutenSku: string;
  amazonSku: string;
  yahooCode: string;
  yahooSubcode: string;
  shopifySku: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  rakutenNumber: "",
  rakutenSku: "",
  amazonSku: "",
  yahooCode: "",
  yahooSubcode: "",
  shopifySku: "",
};

let nextId = INITIAL_MAPPINGS.length + 1;

export default function CodeMappingPage() {
  const toast = useToast();
  const [mappings, setMappings] = useState<Mapping[]>(INITIAL_MAPPINGS);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase();
    if (!k) return mappings;
    return mappings.filter(
      (m) =>
        m.code.toLowerCase().includes(k) ||
        m.name.toLowerCase().includes(k) ||
        m.rakutenNumber.toLowerCase().includes(k) ||
        m.amazonSku.toLowerCase().includes(k) ||
        m.yahooCode.toLowerCase().includes(k) ||
        m.shopifySku.toLowerCase().includes(k),
    );
  }, [mappings, search]);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(m: Mapping) {
    setEditId(m.id);
    setForm({
      code: m.code,
      name: m.name,
      rakutenNumber: m.rakutenNumber,
      rakutenSku: m.rakutenSku,
      amazonSku: m.amazonSku,
      yahooCode: m.yahooCode,
      yahooSubcode: m.yahooSubcode,
      shopifySku: m.shopifySku,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.show("自社コードと商品名は必須です", "error");
      return;
    }
    const status = computeStatus(form);
    if (editId) {
      setMappings((prev) =>
        prev.map((m) =>
          m.id === editId
            ? { ...m, ...form, status }
            : m,
        ),
      );
      toast.show("紐付けを更新しました", "success");
    } else {
      const newMapping: Mapping = {
        id: String(nextId++),
        ...form,
        status,
      };
      setMappings((prev) => [...prev, newMapping]);
      toast.show("新しい紐付けを追加しました", "success");
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    const target = mappings.find((m) => m.id === id);
    if (!target) return;
    if (!confirm(`「${target.code} / ${target.name}」の紐付けを削除しますか？`)) return;
    setMappings((prev) => prev.filter((m) => m.id !== id));
    toast.show("紐付けを削除しました", "success");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商品コード紐づけ</h1>
          <p className="text-sm text-gray-500 mt-1">
            各モールの商品コードを自社コードに関連付けて在庫連携・受注一元管理を実現します。
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all"
        >
          <Plus className="h-4 w-4" />
          新規紐付け
        </button>
      </div>

      <GlassCard className="bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-800 space-y-2">
            <p className="font-medium">紐付けルール（モール別）</p>
            <ul className="text-xs space-y-1 text-gray-700">
              <li>
                <span className="font-medium text-orange-600">Amazon</span>: 商品コード = 出品者SKU
              </li>
              <li>
                <span className="font-medium text-red-600">楽天市場</span>:
                単体は 商品コード = 商品番号、バリエーションは 代表商品コード = 商品番号 / 各SKU = システム連携用SKU番号
              </li>
              <li>
                <span className="font-medium text-purple-600">Yahoo!</span>:
                単体は 商品コード = code、バリエーションは 代表 = code / 各SKU = code+sub-code
              </li>
              <li>
                <span className="font-medium text-green-600">Shopify</span>: 商品コード = SKU
              </li>
            </ul>
          </div>
        </div>
      </GlassCard>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="自社コード・モール側コード・商品名で検索..."
            className="w-full h-9 pl-10 pr-4 rounded-xl text-sm bg-white/60 border border-white/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <a
          href="/products/inventory/check"
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          在庫連携確認画面へ
        </a>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-white/50 border-b border-white/40">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">自社コード</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />楽天市場
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />Amazon SKU
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />Yahoo!
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />Shopify SKU
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">連携状態</th>
                <th className="w-16 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-800 whitespace-nowrap">{m.code}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{m.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {m.rakutenNumber ? (
                      <div>
                        <div className="text-gray-700">{m.rakutenNumber}</div>
                        {m.rakutenSku && (
                          <div className="text-gray-400 text-[10px]">SKU: {m.rakutenSku}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">未設定</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {m.amazonSku ? (
                      <span className="text-gray-700">{m.amazonSku}</span>
                    ) : (
                      <span className="text-gray-400">未設定</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {m.yahooCode ? (
                      <div>
                        <div className="text-gray-700">{m.yahooCode}</div>
                        {m.yahooSubcode && (
                          <div className="text-gray-400 text-[10px]">sub: {m.yahooSubcode}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">未設定</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {m.shopifySku ? (
                      <span className="text-gray-700">{m.shopifySku}</span>
                    ) : (
                      <span className="text-gray-400">未設定</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", sb[m.status])}>
                      {statusLabel[m.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-blue-600 transition-colors"
                        title="編集"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-gray-400">
                    該当する紐付けがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-white/40 bg-white/20 text-xs text-gray-500">
          {filtered.length} 件 / 全 {mappings.length} 件
        </div>
      </GlassCard>

      {/* 新規・編集モーダル */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "コード紐付けを編集" : "新規コード紐付け"}
        footer={
          <>
            <SecondaryButton onClick={() => setModalOpen(false)}>キャンセル</SecondaryButton>
            <PrimaryButton onClick={handleSave}>保存</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                自社コード <span className="text-red-500 ml-0.5">必須</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setField("code", e.target.value)}
                placeholder="WEP-001"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                商品名 <span className="text-red-500 ml-0.5">必須</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="商品名を入力"
                className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />楽天市場
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">商品番号</label>
                <input
                  type="text"
                  value={form.rakutenNumber}
                  onChange={(e) => setField("rakutenNumber", e.target.value)}
                  placeholder="wep-001-r"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  システム連携用SKU番号
                  <span className="text-gray-400 ml-1">（バリエーション時）</span>
                </label>
                <input
                  type="text"
                  value={form.rakutenSku}
                  onChange={(e) => setField("rakutenSku", e.target.value)}
                  placeholder="wep-001-bk"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400" />Amazon 出品者SKU
            </label>
            <input
              type="text"
              value={form.amazonSku}
              onChange={(e) => setField("amazonSku", e.target.value)}
              placeholder="B0WEP001"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-purple-600 mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />Yahoo!ショッピング
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">code</label>
                <input
                  type="text"
                  value={form.yahooCode}
                  onChange={(e) => setField("yahooCode", e.target.value)}
                  placeholder="wep001y"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  sub-code <span className="text-gray-400">（バリエーション時）</span>
                </label>
                <input
                  type="text"
                  value={form.yahooSubcode}
                  onChange={(e) => setField("yahooSubcode", e.target.value)}
                  placeholder="bk"
                  className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-green-600 mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" />Shopify SKU
            </label>
            <input
              type="text"
              value={form.shopifySku}
              onChange={(e) => setField("shopifySku", e.target.value)}
              placeholder="wep-001"
              className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
