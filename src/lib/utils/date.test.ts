import { describe, expect, it } from "vitest";
import { formatDate, plusDays, todayISO } from "@/lib/utils/date";

describe("utils/date", () => {
  it("formats date", () => {
    expect(formatDate("2026-02-10")).toBe("2026-02-10");
  });

  it("adds days", () => {
    expect(plusDays("2026-02-10", 3)).toBe("2026-02-13");
    expect(plusDays("2026-02-10", -1)).toBe("2026-02-09");
  });

  it("returns today iso", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

