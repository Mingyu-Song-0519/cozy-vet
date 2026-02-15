import { NextResponse } from "next/server";

export const runtime = "edge";
import type { ParsedPatient } from "@/types/patient";
import type { ExcelParseResult } from "@/lib/excel/validators";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { makePatientDuplicateKey } from "@/lib/excel/validators";

type PreviewRequestBody = {
  parsed: ExcelParseResult;
};

function isExcelPreviewBody(value: unknown): value is PreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const parsed = (value as { parsed?: unknown }).parsed;
  if (!parsed || typeof parsed !== "object") {
    return false;
  }

  const maybe = parsed as {
    patients?: unknown;
    health_checkups?: unknown;
    warnings?: unknown;
    sheet_summaries?: unknown;
  };

  return (
    Array.isArray(maybe.patients) &&
    Array.isArray(maybe.health_checkups) &&
    Array.isArray(maybe.warnings) &&
    Array.isArray(maybe.sheet_summaries)
  );
}

function countInternalDuplicates(patients: ParsedPatient[]) {
  const seen = new Set<string>();
  let duplicateCount = 0;

  patients.forEach((patient) => {
    if (!patient.chart_number || !patient.visit_date) {
      return;
    }
    const key = makePatientDuplicateKey(patient);
    if (seen.has(key)) {
      duplicateCount += 1;
      return;
    }
    seen.add(key);
  });

  return duplicateCount;
}

export async function POST(request: Request) {
  const rawBody = (await request.json()) as unknown;
  if (!isExcelPreviewBody(rawBody)) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  const body = rawBody;
  const parsed = body.parsed;
  const internalDuplicateCount = countInternalDuplicates(parsed.patients);

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      total_patients: parsed.patients.length,
      total_health_checkups: parsed.health_checkups.length,
      warnings: parsed.warnings,
      sheet_summaries: parsed.sheet_summaries,
      duplicate_count: 0,
      internal_duplicate_count: internalDuplicateCount,
      db_connected: false,
    });
  }

  const supabase = getSupabaseServerClient();
  const chartNumbers = Array.from(
    new Set(
      parsed.patients.map((item) => item.chart_number).filter((value) => value.length > 0),
    ),
  );
  const visitDates = Array.from(
    new Set(
      parsed.patients.map((item) => item.visit_date).filter((value) => value.length > 0),
    ),
  );

  let duplicateCount = 0;
  if (chartNumbers.length > 0 && visitDates.length > 0) {
    const { data } = await supabase
      .from("patients")
      .select("chart_number, visit_date")
      .in("chart_number", chartNumbers)
      .in("visit_date", visitDates);

    const existingKeys = new Set((data ?? []).map((item) => makePatientDuplicateKey(item)));

    duplicateCount = parsed.patients.filter((patient) =>
      existingKeys.has(makePatientDuplicateKey(patient)),
    ).length;
  }

  return NextResponse.json({
    ok: true,
    total_patients: parsed.patients.length,
    total_health_checkups: parsed.health_checkups.length,
    warnings: parsed.warnings,
    sheet_summaries: parsed.sheet_summaries,
    duplicate_count: duplicateCount,
    internal_duplicate_count: internalDuplicateCount,
    db_connected: true,
  });
}
