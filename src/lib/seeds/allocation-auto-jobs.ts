/**
 * allocationAutoJobStore の初期シード値。
 *
 * src/app/products/allocation/auto/page.tsx が正規オーナーとして
 * 空ストアにセットする初期データ（domain: "allocation-auto-jobs"）。
 */

import type { AllocationAutoJobRecord } from "@/lib/stores/allocation-auto-jobs";

export const INITIAL_ALLOCATION_AUTO_JOBS: AllocationAutoJobRecord[] = [
  { id: "J-01", name: "朝次自動引当", schedule: "毎日 09:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-25 09:00", result: "成功", count: 142 },
  { id: "J-02", name: "昼次自動引当", schedule: "毎日 13:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-25 13:00", result: "成功", count: 58 },
  { id: "J-03", name: "夕次自動引当", schedule: "毎日 17:00", target: "新規受付・入金済み", enabled: true, lastRun: "2026-04-24 17:00", result: "成功", count: 73 },
  { id: "J-04", name: "緊急引当（予約商品）", schedule: "発売日 00:00", target: "予約商品全件", enabled: false, lastRun: "—", result: "—", count: 0 },
  { id: "J-05", name: "卸先優先引当", schedule: "毎日 08:30", target: "卸先受注のみ", enabled: true, lastRun: "2026-04-25 08:30", result: "成功", count: 28 },
];
