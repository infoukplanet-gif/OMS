import { describe, it, expect, beforeEach } from "vitest";
import {
  createMailQueue,
  type MailJob,
  type AutoMailEnabled,
} from "./queue";

const job = (overrides: Partial<MailJob> = {}): MailJob => ({
  orderId: "ORD-001",
  triggerType: "thanks",
  dedupeKey: "ORD-001:thanks",
  ...overrides,
});

describe("createMailQueue — enqueue + dedupe", () => {
  it("enqueues a fresh job", () => {
    const queue = createMailQueue();
    const result = queue.enqueueAll([job()]);

    expect(result).toEqual({ enqueued: 1, duplicateSkipped: 0, disabledSkipped: 0 });
    expect(queue.snapshot()).toHaveLength(1);
  });

  it("skips duplicates of (orderId, triggerType)", () => {
    const queue = createMailQueue();
    queue.enqueueAll([job()]);
    const result = queue.enqueueAll([job()]);

    expect(result).toEqual({ enqueued: 0, duplicateSkipped: 1, disabledSkipped: 0 });
    expect(queue.snapshot()).toHaveLength(1);
  });

  it("treats different triggerType for same order as separate jobs", () => {
    const queue = createMailQueue();
    queue.enqueueAll([
      job({ triggerType: "thanks", dedupeKey: "ORD-001:thanks" }),
      job({ triggerType: "ship-notify", dedupeKey: "ORD-001:ship-notify" }),
    ]);

    expect(queue.snapshot()).toHaveLength(2);
  });

  it("counts mixed batch correctly (new + duplicate)", () => {
    const queue = createMailQueue();
    queue.enqueueAll([job({ dedupeKey: "ORD-A:thanks" })]);

    const result = queue.enqueueAll([
      job({ dedupeKey: "ORD-A:thanks" }),
      job({ dedupeKey: "ORD-B:thanks", orderId: "ORD-B" }),
      job({ dedupeKey: "ORD-C:thanks", orderId: "ORD-C" }),
    ]);

    expect(result).toEqual({ enqueued: 2, duplicateSkipped: 1, disabledSkipped: 0 });
    expect(queue.snapshot()).toHaveLength(3);
  });
});

describe("createMailQueue — disabled triggers", () => {
  const enabled: AutoMailEnabled = {
    thanks: true,
    "ship-notify": true,
    "payment-confirmed": false, // disabled
  };

  it("skips jobs for disabled triggers (without consuming dedupe slot)", () => {
    const queue = createMailQueue();

    const result = queue.enqueueAll(
      [
        job({ triggerType: "payment-confirmed", dedupeKey: "ORD-1:payment-confirmed" }),
        job({ triggerType: "thanks", dedupeKey: "ORD-1:thanks" }),
      ],
      enabled,
    );

    expect(result).toEqual({ enqueued: 1, duplicateSkipped: 0, disabledSkipped: 1 });
    expect(queue.snapshot()).toHaveLength(1);
  });

  it("allows the disabled trigger to be enabled later (no spurious dedupe block)", () => {
    const queue = createMailQueue();

    queue.enqueueAll(
      [job({ triggerType: "payment-confirmed", dedupeKey: "ORD-1:payment-confirmed" })],
      enabled,
    );
    const secondPass = queue.enqueueAll(
      [job({ triggerType: "payment-confirmed", dedupeKey: "ORD-1:payment-confirmed" })],
      { thanks: true, "ship-notify": true, "payment-confirmed": true },
    );

    expect(secondPass).toEqual({ enqueued: 1, duplicateSkipped: 0, disabledSkipped: 0 });
  });
});

describe("createMailQueue — purity guards", () => {
  let queue: ReturnType<typeof createMailQueue>;
  beforeEach(() => {
    queue = createMailQueue();
  });

  it("does not mutate input batch", () => {
    const input = [job()];
    const snapshot = [...input];
    queue.enqueueAll(input);
    expect(input).toEqual(snapshot);
  });

  it("snapshot() returns a copy (caller cannot mutate internal state)", () => {
    queue.enqueueAll([job()]);
    const snap = queue.snapshot();
    snap.length = 0;
    expect(queue.snapshot()).toHaveLength(1);
  });

  it("each enqueueAll call is independent (no cross-call effect besides dedupe set)", () => {
    queue.enqueueAll([job({ dedupeKey: "ORD-A:thanks" })]);
    const r = queue.enqueueAll([job({ dedupeKey: "ORD-B:thanks", orderId: "ORD-B" })]);
    expect(r.enqueued).toBe(1);
  });
});
