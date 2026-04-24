---
name: oms-click-path-audit
description: OMSの全ボタン・リンク・フォーム送信の遷移先を追跡し、404・機能していないボタン・リンク切れを検出する監査スキル。前セッションで「卸先登録ボタンも機能してない」問題が出たので必須。
---

# OMS Click Path Audit

前セッションで「卸先マスタ編集はどこからいけるの？卸先登録ボタンも機能してない」という問題が発生。この監査はそれを再発させないためのランブック。

## 監査手順

### 1. 全ページ列挙
```bash
find src/app -name "page.tsx" | sed 's|src/app||; s|/page.tsx||; s|^|/|'
```

### 2. 全Link/Button収集
```bash
# Next Link の href 抽出
grep -rhoP 'href=["\047]/[^"\047]+' src/app src/components | sort -u

# onClick / router.push で遷移するもの
grep -rnP 'router\.push\(["\047]/[^"\047]+' src
```

### 3. 未実装ボタン検出
- `onClick={() => {}}` のような空ハンドラ
- `<button>` なのに onClick / type="submit" が無いもの
- `href="#"` の仮リンク

### 4. サイドバー整合
`src/components/layout/sidebar.tsx` の全linkと、Step1の全ページ一覧を照合。

### 5. 新規登録ボタン整合
`/xxx/new` パターンのリンクは対応する `src/app/xxx/new/page.tsx` が存在するか確認。

## 報告フォーマット

```
## クリックパス監査結果

### 死んだリンク (404)
- /settings/users/new — sidebar にあるが page.tsx 無し

### 機能していないボタン
- src/app/customers/page.tsx:42 — 「卸先登録」ボタンが onClick 空

### 仮リンク
- src/app/xxx:nn — href="#"
```

## 自動修復方針

死んだリンクは `oms-page-builder` に委譲して新規ページを即時生成。機能していないボタンは遷移先を推測して `router.push` or `<Link>` に置き換え。

## 呼ぶタイミング

- oms-verifier の Step 3 (ルート整合) 内で必ず実行
- デプロイ前
- 「ボタンが動かない」系の報告があったら最優先
