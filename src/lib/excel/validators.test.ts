import { describe, expect, it } from "vitest";
import {
  makePatientDuplicateKey,
  validatePatientRequiredFields,
} from "@/lib/excel/validators";
import type { ParsedPatient } from "@/types/patient";

function makePatient(overrides: Partial<ParsedPatient> = {}): ParsedPatient {
  return {
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
    payment_amount: 100000,
    payment_status: "paid",
    staff_in_charge: null,
    is_revisit: false,
    revisit_date: null,
    source_month: "2026-02",
    row_number: 3,
    ...overrides,
  };
}

describe("excel/validators", () => {
  it("validates required patient fields", () => {
    const warnings = validatePatientRequiredFields(
      "2026-02",
      3,
      makePatient({
        chart_number: "",
        owner_name: "",
      }),
    );

    expect(warnings.length).toBe(2);
    expect(warnings[0].message).toContain("차트번호");
    expect(warnings[1].message).toContain("보호자");
  });

  it("builds patient duplicate key", () => {
    const key = makePatientDuplicateKey(makePatient());
    expect(key).toBe("12706::2026-02-10");
  });
});

