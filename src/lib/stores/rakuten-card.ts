/**
 * 楽天カード決済オーソリ 共有ストア（collection パターン）。
 *
 * payments/rakuten-card ページのオーソリ行（受注番号/顧客/金額/オーソリ日/期限/
 * 残日数/確定ステータス）を id をキーにした複数レコードとして createMasterStore に
 * 載せ、売上確定をリロード後も復元する。
 *
 * 確定ステータス遷移は state-machine transitionCardAuthorization を経由する
 * （ページで status を直書きしない）。
 *
 * 永続化（domain: "rakuten-card-rows"）の正規オーナーページは
 * src/app/payments/rakuten-card/page.tsx。
 */

import { createMasterStore, type MasterStore } from "./create-master-store";
import type { CardAuthorizationRecord } from "../state-machines/card-authorization";
import { INITIAL_RAKUTEN_CARD_ROWS } from "../seeds/rakuten-card";

export const rakutenCardStore: MasterStore<CardAuthorizationRecord> =
  createMasterStore<CardAuthorizationRecord>(INITIAL_RAKUTEN_CARD_ROWS);
