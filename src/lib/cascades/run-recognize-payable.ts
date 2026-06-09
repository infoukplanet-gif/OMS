/**
 * 発注入荷 → 買掛金計上 glue（global singleton 隔離層）。
 *
 * 仕様: docs/prd/payable-recognition-v1.md
 *
 * 純粋 cascade recognizePayableOnReceipt に payableStore シングルトンを束ねる薄い接着剤。
 * 入荷ページ（purchasing/page・purchasing/receiving）は applyReceive 直後にこの 1 行を呼ぶだけ。
 * 計上日（accruedAt）は Date を持たない lib を保つため呼び出し側（page）が渡す。
 */

import { payableStore } from "../stores/payable";
import {
  recognizePayableOnReceipt,
  type RecognizePayableArgs,
  type RecognizePayableCascadeResult,
} from "./recognize-payable";

export function runRecognizePayableOnReceipt(
  args: RecognizePayableArgs,
): RecognizePayableCascadeResult {
  return recognizePayableOnReceipt({ payableStore }, args);
}
