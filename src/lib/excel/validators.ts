import type { ParsedHealthCheckup, ParsedPatient } from "@/types/patient";

export type ParseWarning = {
  sheet: string;
  row: number;
  message: string;
};

export type SheetSummary = {
  sheet: string;
  patient_count: number;
  checkup_count: number;
  warning_count: number;
};

export type ExcelParseResult = {
  patients: ParsedPatient[];
  health_checkups: ParsedHealthCheckup[];
  warnings: ParseWarning[];
  sheet_summaries: SheetSummary[];
};

export function validatePatientRequiredFields(
  sheet: string,
  row: number,
  patient: ParsedPatient,
) {
  const warnings: ParseWarning[] = [];

  if (!patient.chart_number) {
    warnings.push({ sheet, row, message: "차트번호 누락" });
  }
  if (!patient.visit_date) {
    warnings.push({ sheet, row, message: "내원날짜 누락" });
  }
  if (!patient.owner_name) {
    warnings.push({ sheet, row, message: "보호자 성함 누락" });
  }
  if (!patient.pet_name) {
    warnings.push({ sheet, row, message: "동물 이름 누락" });
  }

  return warnings;
}

export function makePatientDuplicateKey(
  patient: Pick<ParsedPatient, "chart_number" | "visit_date">,
) {
  return `${patient.chart_number}::${patient.visit_date}`;
}
