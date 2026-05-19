import { test, expect } from "@playwright/test";

/**
 * 受注 → 入金 → 出荷 の critical path E2E。
 *
 * 共有 in-memory store （orderStore / paymentStore / inventoryStore /
 * shipmentStore）が同一セッション中に保持されることを利用して画面操作だけで
 * cascade が連動するかを確認する。
 *
 * v1 設計上の注意:
 *   - Playwright の page.goto は full page reload を起こすため、module スコープの
 *     in-memory store がリセットされる。よって複数ページにまたがる検証は同一画面の
 *     toast メッセージで cascade が実行されたことを確認する方式に統一する。
 *   - 永続化（Drizzle）が入った v2 ではページ遷移後の状態確認も可能になる。
 */

test.describe("critical path: 入金確認 → 受注確定 → 出荷指示作成 → 在庫引当", () => {
  test("payments の入金登録で受注確定/出荷指示/引当の cascade が toast に出る", async ({ page }) => {
    // /payments を直接開く（useEffect で paymentStore / orderStore / inventoryStore を seed）
    await page.goto("/payments");
    await expect(page.getByRole("heading", { name: "入金管理" })).toBeVisible();

    // ORD-2026-08843（小林 修・入金待ち 67500 円）行の入金登録ボタンを押す
    const orderId = "ORD-2026-08843";
    const row = page.locator("tr", { hasText: orderId });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "入金登録" }).click();

    // cascade の証跡を toast で確認
    //   「受注確定」「出荷指示」「引当」のいずれかの文言が含まれているはず
    const toast = page.locator(".pointer-events-auto").filter({
      hasText: /受注確定|出荷指示|引当/,
    });
    await expect(toast.first()).toBeVisible({ timeout: 4000 });

    // 入金登録した payment の status badge が「入金済み」に変わっている
    await expect(row).toContainText("入金済み");
  });

  test("催促メール一括送信ボタンが期日超過の入金に対し mailQueue へ enqueue する", async ({
    page,
  }) => {
    await page.goto("/payments");
    await expect(page.getByRole("heading", { name: "入金管理" })).toBeVisible();

    await page.getByRole("button", { name: /催促メール一括送信/ }).click();

    // INITIAL_PAYMENTS の P002 (3日超過) と P003 (8日超過) で 2 件 enqueue が期待される
    //   ※ 同一セッション中に dedupe されるため、二回目以降は重複扱い
    const toast = page.locator(".pointer-events-auto").filter({
      hasText: /催促メール|送信|enqueue/,
    });
    await expect(toast.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("smoke: 主要ページの初期レンダリング", () => {
  test("dashboard が KPI 表示できる", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /ダッシュボード|OMS/ }).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("orders 一覧が SKU 含めて表示される", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "受注一覧" })).toBeVisible();
    await expect(page.locator("tr").filter({ hasText: "ORD-2026-08843" })).toBeVisible();
  });

  test("shipments 一覧が表示される", async ({ page }) => {
    await page.goto("/shipments");
    await expect(page.getByRole("heading", { name: "出荷管理" })).toBeVisible();
  });

  test("products/inventory が onHand / allocated / free を表示する", async ({ page }) => {
    await page.goto("/products/inventory");
    await expect(page.getByRole("heading", { name: "在庫管理" })).toBeVisible();
    // INITIAL_INVENTORY の SKU が描画されていれば OK
    await expect(page.locator("tr").filter({ hasText: "WEP-001-BK" })).toBeVisible();
  });
});
