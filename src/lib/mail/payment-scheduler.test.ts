import { describe, it, expect } from "vitest";
import {
  scheduleOverdueReminders,
  type OverduePayment,
} from "./payment-scheduler";

const payment = (overrides: Partial<OverduePayment> = {}): OverduePayment => ({
  paymentId: "P-001",
  orderId: "ORD-001",
  due: "2026-05-01",
  paidAmount: 0,
  orderTotal: 10000,
  ...overrides,
});

const today = (date: string): Date => new Date(`${date}T00:00:00Z`);

describe("scheduleOverdueReminders", () => {
  it("returns no jobs when no payments are overdue", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-05-10" })],
      today("2026-05-05"),
    );
    expect(jobs).toEqual([]);
  });

  it("returns no jobs when payment is fully paid (status derived)", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-04-01", paidAmount: 10000 })],
      today("2026-05-01"),
    );
    expect(jobs).toEqual([]);
  });

  it("returns payment-reminder-3d when 3 days overdue", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-05-01" })],
      today("2026-05-04"),
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].triggerType).toBe("payment-reminder-3d");
    expect(jobs[0].dedupeKey).toBe("ORD-001:payment-reminder-3d");
  });

  it("does NOT emit reminder-3d before 3 days", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-05-01" })],
      today("2026-05-03"),
    );
    expect(jobs).toEqual([]);
  });

  it("returns payment-final-call-7d (NOT reminder-3d) when 7+ days overdue", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-05-01" })],
      today("2026-05-08"),
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].triggerType).toBe("payment-final-call-7d");
  });

  it("emits one job per overdue payment, picking the higher tier", () => {
    const jobs = scheduleOverdueReminders(
      [
        payment({ orderId: "A", due: "2026-05-04" }),
        payment({ orderId: "B", due: "2026-05-01" }), // 4d overdue → reminder-3d
        payment({ orderId: "C", due: "2026-04-25" }), // 10d overdue → final-call
        payment({ orderId: "D", due: "2026-05-10" }), // not overdue
        payment({ orderId: "E", due: "2026-04-30", paidAmount: 10000, orderTotal: 10000 }), // paid
      ],
      today("2026-05-05"),
    );
    expect(jobs.map((j) => `${j.orderId}:${j.triggerType}`).sort()).toEqual([
      "B:payment-reminder-3d",
      "C:payment-final-call-7d",
    ]);
  });

  it("partial payments still trigger reminders (not fully paid)", () => {
    const jobs = scheduleOverdueReminders(
      [payment({ due: "2026-04-25", paidAmount: 4000, orderTotal: 10000 })],
      today("2026-05-05"),
    );
    expect(jobs).toHaveLength(1);
    expect(jobs[0].triggerType).toBe("payment-final-call-7d");
  });
});
