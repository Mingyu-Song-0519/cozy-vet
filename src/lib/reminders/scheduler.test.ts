import { describe, expect, it } from "vitest";
import { buildRemindersForPatient } from "@/lib/reminders/scheduler";
import type { Database } from "@/lib/supabase/types";

function createPatient(
  overrides: Partial<Database["public"]["Tables"]["patients"]["Row"]> = {},
): Database["public"]["Tables"]["patients"]["Row"] {
  return {
    id: "p1",
    chart_number: "12706",
    visit_date: "2026-02-10",
    owner_name: "김OO",
    pet_name: "겨울이",
    species: "dog",
    household_type: null,
    referral_source: null,
    department: "내과",
    residential_area: null,
    naver_booking: false,
    payment_amount: 450000,
    payment_status: "paid",
    staff_in_charge: null,
    is_revisit: false,
    revisit_date: "2026-02-20T14:00:00Z",
    source_month: "2026-02",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
    ...overrides,
  };
}

describe("reminders/scheduler", () => {
  it("creates revisit and followup reminders", () => {
    const reminders = buildRemindersForPatient(createPatient());
    expect(reminders).toHaveLength(3);
    expect(reminders.some((item) => item.type === "revisit_d1")).toBe(true);
    expect(reminders.some((item) => item.message_template_type === "followup_high_3m")).toBe(
      true,
    );
    expect(reminders.some((item) => item.message_template_type === "followup_high_6m")).toBe(
      true,
    );
  });

  it("does not create followup reminders for revisit patients", () => {
    const reminders = buildRemindersForPatient(
      createPatient({
        is_revisit: true,
      }),
    );

    expect(reminders).toHaveLength(1);
    expect(reminders[0].type).toBe("revisit_d1");
  });

  it("creates low-tier templates when payment is below threshold", () => {
    const reminders = buildRemindersForPatient(
      createPatient({
        payment_amount: 100000,
      }),
    );
    expect(reminders.some((item) => item.message_template_type === "followup_low_3m")).toBe(
      true,
    );
    expect(reminders.some((item) => item.message_template_type === "followup_low_6m")).toBe(
      true,
    );
  });

  it("skips followup when payment amount is null", () => {
    const reminders = buildRemindersForPatient(
      createPatient({
        payment_amount: null,
        revisit_date: null,
      }),
    );
    expect(reminders).toHaveLength(0);
  });
});
