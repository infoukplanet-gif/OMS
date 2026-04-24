---
name: oms-conventions
description: OMSプロジェクトのコーディング規約・デザインルール・必須コンポーネントの完全リファレンス。ページを書く前・コードを変更する前に必ず参照する。
---

# OMS Coding Conventions

## ファイル構成
- ページ: `src/app/{route}/page.tsx`
- レイアウト: `src/app/layout.tsx`
- コンポーネント: `src/components/`
  - `ui/` — shadcn/ui ベース + GlassCard, DatePicker
  - `layout/` — Sidebar, Header, AppShell

## 必須インポート
```tsx
"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { DatePicker } from "@/components/ui/date-picker";  // 日付に使う
import { cn } from "@/lib/utils";
import { /* icon */ } from "lucide-react";
```

## デザイントークン

### カラー
- 背景: `bg-[#f0f2f5]`
- アクセント: `#3B82F6` (青)
- セカンダリ: `#8B5CF6` (紫)
- ターシャリ: `#06B6D4` (シアン)
- テキスト: `text-gray-800` (主), `text-gray-600` (副), `text-gray-400` (薄)

### ガラスカード
```tsx
className="rounded-2xl p-5 bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]"
```

### ボタン
プライマリ:
```tsx
className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/80 backdrop-blur-xl border border-blue-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-white hover:bg-blue-500/90 transition-all"
```

セカンダリ:
```tsx
className="px-4 py-2 rounded-xl text-sm bg-white/60 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] text-gray-700 hover:bg-white/80 transition-all"
```

### ステータスバッジ
```tsx
const statusBadge: Record<string, string> = {
  "新規受付": "bg-blue-500/15 text-blue-700",
  "確認待ち": "bg-yellow-500/15 text-yellow-700",
  "出荷待ち": "bg-orange-500/15 text-orange-700",
  "出荷済み": "bg-emerald-500/15 text-emerald-700",
  "完了": "bg-gray-500/15 text-gray-600",
  "キャンセル": "bg-red-500/15 text-red-700",
};
<span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusBadge[status])}>
  {status}
</span>
```

### 入力フィールド
```tsx
className="w-full h-9 px-3 rounded-xl text-sm bg-white/50 border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
```

### テーブル
```tsx
<GlassCard className="p-0 overflow-hidden">
  <table className="w-full text-sm">
    <thead><tr className="bg-white/50 border-b border-white/40">
      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">列名</th>
    </tr></thead>
    <tbody>{data.map(d => (
      <tr key={d.id} className="border-t border-white/30 hover:bg-white/40 transition-colors">
        <td className="px-3 py-2.5">...</td>
      </tr>
    ))}</tbody>
  </table>
</GlassCard>
```

## 禁止事項
1. ❌ `<input type="date">` → DatePicker使用
2. ❌ グラデーション（`bg-gradient-*`、`from-*-to-*`）
3. ❌ 競合システム名（ネクストエンジン等）
4. ❌ 英語フィールド名（`product_name` → `商品名`）
5. ❌ ゼブラストライプ（交互背景）
6. ❌ 絵文字でアイコン代用 → lucide-react

## ルール
- 全UIテキスト日本語
- カラ ードはガラス質感
- 角丸 `rounded-xl` 以上
- マスタ登録フォームは20+項目
- 一覧テーブルは業務的に十分な列数
