---
name: add-page
description: OMSに新しいページを追加するワークフロー。リファレンス画像があればそれと照合してフィールドを抽出、なければ業界標準で設計、Liquid Glass UIで実装、サイドバーへのリンク追加までを一貫して行う。
---

# Add Page Skill

OMSに新規ページを追加する標準ワークフロー。

## ステップ

### 1. リファレンス確認
- `C:\Users\bjex1\Desktop\OMS\reference\screenshot\` に該当画像があるか確認
- あれば Read で内容把握
- なければ `oms-architect` に設計を依頼

### 2. ページタイプ判定
- 一覧ページ → 検索/フィルタ/テーブル/一括操作/ページネーション
- 登録フォーム → セクション/必須項目/20+フィールド
- 詳細ページ → パンくず/明細/サブ情報パネル
- 設定ページ → 縦タブ/トグル
- ダウンロードページ → DatePicker/出力形式

### 3. ディレクトリ作成
```bash
mkdir -p src/app/{path}
```

### 4. page.tsx 作成
- 必須インポート（`"use client"`, GlassCard, cn, lucide）
- 日付があれば DatePicker
- 全テキスト日本語
- サンプルデータ含む
- Liquid Glass デザイン

### 5. サイドバーに追加
`src/components/layout/sidebar.tsx` の menuItems に追加。
親カテゴリの children 配列に `{ label: "...", href: "..." }`。

### 6. レビュー
`oms-reviewer` を呼んで監査。

### 7. 動作確認
ブラウザで開いて崩れがないか確認。

## 注意
- 競合システム名禁止
- グラデーション禁止
- `<input type="date">` 禁止
- 絵文字でアイコン代用禁止
