import { describe, it, expect, beforeEach } from "vitest";
import {
  getAutoMailEnabled,
  setAutoMailEnabled,
  resetAutoMailEnabled,
  DEFAULT_AUTO_MAIL_ENABLED,
} from "./auto-settings";

describe("auto-settings — module-level enabled map", () => {
  beforeEach(() => {
    resetAutoMailEnabled();
  });

  it("returns all-enabled defaults on first read", () => {
    expect(getAutoMailEnabled()).toEqual(DEFAULT_AUTO_MAIL_ENABLED);
  });

  it("merges patches into the current enabled map", () => {
    setAutoMailEnabled({ "payment-confirmed": false });
    expect(getAutoMailEnabled()).toEqual({
      thanks: true,
      "ship-notify": true,
      "payment-confirmed": false,
    });
  });

  it("multiple setAutoMailEnabled calls compound", () => {
    setAutoMailEnabled({ thanks: false });
    setAutoMailEnabled({ "ship-notify": false });
    expect(getAutoMailEnabled()).toEqual({
      thanks: false,
      "ship-notify": false,
      "payment-confirmed": true,
    });
  });

  it("resetAutoMailEnabled restores defaults", () => {
    setAutoMailEnabled({ thanks: false, "ship-notify": false });
    resetAutoMailEnabled();
    expect(getAutoMailEnabled()).toEqual(DEFAULT_AUTO_MAIL_ENABLED);
  });

  it("returned object is a copy (caller cannot mutate internal state)", () => {
    const snapshot = getAutoMailEnabled();
    (snapshot as Record<string, boolean>).thanks = false;
    expect(getAutoMailEnabled().thanks).toBe(true);
  });
});
