import { describe, it, expect } from "vitest";
import {
  transitionDownloadJob,
  canTransitionDownloadJob,
  nextDownloadJobStatus,
  type DownloadJobRecord,
} from "./download-job";

const base: DownloadJobRecord = {
  id: "DL-20260429-0415",
  category: "顧客別購入分析",
  filename: "customers_2026-04.csv",
  range: "2026/04/01-2026/04/29",
  user: "system",
  format: "CSV",
  records: 0,
  size: "—",
  startedAt: "2026/04/29 08:00",
  duration: "60s",
  status: "failed",
};

describe("transitionDownloadJob - 再実行/完了フロー", () => {
  it("start: failed → running", () => {
    expect(transitionDownloadJob(base, "start").status).toBe("running");
  });

  it("succeed: running → success", () => {
    const running: DownloadJobRecord = { ...base, status: "running" };
    expect(transitionDownloadJob(running, "succeed").status).toBe("success");
  });

  it("fail: running → failed", () => {
    const running: DownloadJobRecord = { ...base, status: "running" };
    expect(transitionDownloadJob(running, "fail").status).toBe("failed");
  });
});

describe("transitionDownloadJob - ガード（不正遷移は no-op で同一参照）", () => {
  it("success は終端（start/succeed/fail 不可・同一参照）", () => {
    const done: DownloadJobRecord = { ...base, status: "success" };
    expect(transitionDownloadJob(done, "start")).toBe(done);
    expect(transitionDownloadJob(done, "succeed")).toBe(done);
    expect(transitionDownloadJob(done, "fail")).toBe(done);
  });

  it("expired は終端（start/succeed/fail 不可・同一参照）", () => {
    const expired: DownloadJobRecord = { ...base, status: "expired" };
    expect(transitionDownloadJob(expired, "start")).toBe(expired);
    expect(transitionDownloadJob(expired, "succeed")).toBe(expired);
  });

  it("failed に succeed/fail は不可（同一参照）", () => {
    expect(transitionDownloadJob(base, "succeed")).toBe(base);
    expect(transitionDownloadJob(base, "fail")).toBe(base);
  });

  it("running に start は不可（同一参照）", () => {
    const running: DownloadJobRecord = { ...base, status: "running" };
    expect(transitionDownloadJob(running, "start")).toBe(running);
  });
});

describe("transitionDownloadJob - 不変性", () => {
  it("元レコードを破壊しない", () => {
    const next = transitionDownloadJob(base, "start");
    expect(base.status).toBe("failed");
    expect(next).not.toBe(base);
  });

  it("filename/user など他項目は維持する", () => {
    const next = transitionDownloadJob(base, "start");
    expect(next.filename).toBe("customers_2026-04.csv");
    expect(next.user).toBe("system");
  });
});

describe("canTransitionDownloadJob / nextDownloadJobStatus", () => {
  it("canTransitionDownloadJob は遷移可否を返す", () => {
    expect(canTransitionDownloadJob("failed", "start")).toBe(true);
    expect(canTransitionDownloadJob("running", "succeed")).toBe(true);
    expect(canTransitionDownloadJob("running", "fail")).toBe(true);
    expect(canTransitionDownloadJob("success", "start")).toBe(false);
    expect(canTransitionDownloadJob("expired", "start")).toBe(false);
  });

  it("nextDownloadJobStatus は遷移先 or null を返す", () => {
    expect(nextDownloadJobStatus("failed", "start")).toBe("running");
    expect(nextDownloadJobStatus("running", "succeed")).toBe("success");
    expect(nextDownloadJobStatus("success", "start")).toBeNull();
  });
});
