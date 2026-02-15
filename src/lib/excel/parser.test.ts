import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseExcelBuffer } from "@/lib/excel/parser";

function makeWorkbookArray() {
  const monthlySheet = XLSX.utils.aoa_to_sheet([]);
  XLSX.utils.sheet_add_aoa(
    monthlySheet,
    [[
      1,
      "12706",
      "2026-02-10",
      "김OO",
      "겨울이",
      "강아지",
      "1마리",
      "인터넷",
      "내과",
      "인천",
      "O",
      "450000",
      "원장",
      "",
      "재진X",
    ]],
    { origin: "A3" },
  );
  XLSX.utils.sheet_add_aoa(
    monthlySheet,
    [[
      2,
      "",
      "2026-02-11",
      "박OO",
      "여름이",
      "고양이",
      "",
      "",
      "외과",
      "",
      "",
      "180000",
      "",
      "",
      "재진X",
    ]],
    { origin: "A10" },
  );
  XLSX.utils.sheet_add_aoa(
    monthlySheet,
    [[
      "김OO",
      "010-1111-2222",
      "겨울이",
      "강아지",
      "2020",
      "암컷",
      "3.1",
      "나혼자",
      "100000",
      "0",
      "100000",
      "1000",
      "특이사항",
      "2026-03-01",
      "2026-03-05",
      "오후",
      "기침",
      "",
      "O",
    ]],
    { origin: "A137" },
  );

  const copySheet = XLSX.utils.aoa_to_sheet([["복사용"]]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, monthlySheet, "2026-02");
  XLSX.utils.book_append_sheet(workbook, copySheet, "복사용");

  const nodeBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  );
}

describe("excel/parser", () => {
  it("parses monthly sheets and ignores copy sheet", () => {
    const result = parseExcelBuffer(makeWorkbookArray());
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0].chart_number).toBe("12706");
    expect(result.sheet_summaries[0].sheet).toBe("2026-02");
  });

  it("adds warning for missing chart number row", () => {
    const result = parseExcelBuffer(makeWorkbookArray());
    expect(result.warnings.some((warning) => warning.message.includes("Row 10"))).toBe(true);
  });

  it("parses health checkup rows", () => {
    const result = parseExcelBuffer(makeWorkbookArray());
    expect(result.health_checkups).toHaveLength(1);
    expect(result.health_checkups[0].pet_name).toBe("겨울이");
  });

  it("reports progress while parsing", () => {
    const events: Array<{ stage: string; percent: number }> = [];
    parseExcelBuffer(makeWorkbookArray(), (progress) => {
      events.push({ stage: progress.stage, percent: progress.percent });
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events.at(-1)).toEqual({ stage: "done", percent: 100 });
    expect(events.some((event) => event.stage === "parsing")).toBe(true);
  });
});
