import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_AUTO_REALLOCATE_SETTINGS,
  getAutoReallocateSettings,
  resetAutoReallocateSettings,
  setAutoReallocateSettings,
} from "./auto-reallocate-settings";

describe("auto-reallocate-settings — 入荷時自動再引当のON/OFF設定", () => {
  beforeEach(() => {
    resetAutoReallocateSettings();
  });

  it("デフォルトは有効（enabled=true）", () => {
    expect(getAutoReallocateSettings()).toEqual({ enabled: true });
    expect(DEFAULT_AUTO_REALLOCATE_SETTINGS.enabled).toBe(true);
  });

  it("setで部分上書きできる", () => {
    setAutoReallocateSettings({ enabled: false });
    expect(getAutoReallocateSettings().enabled).toBe(false);
  });

  it("getはコピーを返す（内部状態が外部mutationで壊れない）", () => {
    const a = getAutoReallocateSettings();
    a.enabled = false;
    expect(getAutoReallocateSettings().enabled).toBe(true);
  });

  it("resetでデフォルトに戻る", () => {
    setAutoReallocateSettings({ enabled: false });
    resetAutoReallocateSettings();
    expect(getAutoReallocateSettings().enabled).toBe(true);
  });
});
