import { NextResponse } from "next/server";

export const runtime = "edge";
import type { ExcelParseResult } from "@/lib/excel/validators";
import type { Database } from "@/lib/supabase/types";
import type { ParsedHealthCheckup, ParsedPatient } from "@/types/patient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { makePatientDuplicateKey } from "@/lib/excel/validators";
import { buildRemindersForPatient } from "@/lib/reminders/scheduler";

type ImportRequestBody = {
  parsed: ExcelParseResult;
  duplicateMode: "skip" | "overwrite";
};

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type HealthCheckupInsert = Database["public"]["Tables"]["health_checkups"]["Insert"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

function isExcelImportBody(value: unknown): value is ImportRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const duplicateMode = (value as { duplicateMode?: unknown }).duplicateMode;
  if (duplicateMode !== "skip" && duplicateMode !== "overwrite") {
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

function hasPatientRequiredFields(patient: ParsedPatient) {
  return Boolean(
    patient.chart_number &&
    patient.visit_date &&
    patient.owner_name &&
    patient.pet_name &&
    patient.department,
  );
}

// DB VARCHAR 길이 안전 처리 헬퍼
function truncateStr(value: string | null, maxLen: number): string | null {
  if (!value) return null;
  return value.length > maxLen ? value.substring(0, maxLen) : value;
}

function toPatientInsert(patient: ParsedPatient): PatientInsert {
  // chart_number가 쉼표 구분 복수값인 경우 첫 번째만 사용
  let chartNumber = patient.chart_number;
  if (chartNumber.includes(",")) {
    chartNumber = chartNumber.split(",")[0].trim();
  }

  return {
    chart_number: chartNumber,
    visit_date: patient.visit_date,
    owner_name: patient.owner_name,
    pet_name: patient.pet_name,
    species: patient.species,
    household_type: truncateStr(patient.household_type, 50),
    referral_source: truncateStr(patient.referral_source, 100),
    department: patient.department,
    residential_area: truncateStr(patient.residential_area, 100),
    naver_booking: patient.naver_booking,
    payment_amount: patient.payment_amount,
    payment_status: patient.payment_status,
    staff_in_charge: truncateStr(patient.staff_in_charge, 50),
    is_revisit: patient.is_revisit,
    revisit_date: patient.revisit_date,
    source_month: patient.source_month,
  };
}

function toCheckupInsert(checkup: ParsedHealthCheckup): HealthCheckupInsert {
  return {
    owner_name: checkup.owner_name,
    contact: checkup.contact,
    pet_name: checkup.pet_name,
    species: checkup.species,
    birth_year: checkup.birth_year,
    sex: checkup.sex,
    weight: checkup.weight,
    checkup_type: checkup.checkup_type,
    base_cost: checkup.base_cost,
    additional_cost: checkup.additional_cost,
    final_cost: checkup.final_cost,
    points: checkup.points,
    notes: checkup.notes,
    preferred_date_1: checkup.preferred_date_1,
    preferred_date_2: checkup.preferred_date_2,
    preferred_time: checkup.preferred_time,
    concerns: checkup.concerns,
    completion_date: checkup.completion_date,
    review_status: checkup.review_status,
    source_month: checkup.source_month,
  };
}

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const rawBody = (await request.json()) as unknown;
  if (!isExcelImportBody(rawBody)) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  const body = rawBody;
  const duplicateMode = body.duplicateMode;
  const parsed = body.parsed;

  const filteredPatients = parsed.patients.filter(hasPatientRequiredFields);
  const skippedInvalidCount = parsed.patients.length - filteredPatients.length;

  const deduplicatedMap = new Map<string, ParsedPatient>();
  let duplicateInFileCount = 0;
  filteredPatients.forEach((patient) => {
    const key = makePatientDuplicateKey(patient);
    if (deduplicatedMap.has(key)) {
      duplicateInFileCount += 1;
      if (duplicateMode === "overwrite") {
        deduplicatedMap.set(key, patient);
      }
      return;
    }
    deduplicatedMap.set(key, patient);
  });
  const deduplicatedPatients = Array.from(deduplicatedMap.values());

  // Cloudflare Edge Runtime Env check
  let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const cf = getRequestContext();
    if (cf && cf.env) {
      envUrl = envUrl || (cf.env as any).NEXT_PUBLIC_SUPABASE_URL;
      envKey = envKey || (cf.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  } catch (e) {
    // getRequestContext might fail locally or in non-cf environments
  }

  if (!hasSupabaseEnv(envUrl, envKey)) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      duplicateMode,
      imported: {
        patients: deduplicatedPatients.length,
        health_checkups: parsed.health_checkups.filter(
          (item) => item.owner_name && item.pet_name,
        ).length,
      },
      duplicate_in_file_count: duplicateInFileCount,
      skipped_invalid_count: skippedInvalidCount,
      duplicate_with_db_count: 0,
      reminders_created: 0,
      warnings: parsed.warnings.length,
      message: "Supabase 환경변수가 없어 DB 저장은 수행하지 않았습니다.",
    });
  }

  const supabase = getSupabaseServerClient(envUrl, envKey);
  const chartNumbers = Array.from(
    new Set(deduplicatedPatients.map((item) => item.chart_number)),
  );
  const visitDates = Array.from(new Set(deduplicatedPatients.map((item) => item.visit_date)));

  const existingByKey = new Map<
    string,
    Pick<PatientRow, "id" | "chart_number" | "visit_date">
  >();
  if (chartNumbers.length > 0 && visitDates.length > 0) {
    const { data: existingRows, error: existingError } = await supabase
      .from("patients")
      .select("id, chart_number, visit_date")
      .in("chart_number", chartNumbers)
      .in("visit_date", visitDates);
    if (existingError) {
      return NextResponse.json(
        { ok: false, message: `기존 환자 조회 실패: ${existingError.message}` },
        { status: 500 },
      );
    }
    (existingRows ?? []).forEach((row) => {
      existingByKey.set(
        makePatientDuplicateKey(row as Pick<PatientRow, "chart_number" | "visit_date">),
        row as Pick<PatientRow, "id" | "chart_number" | "visit_date">,
      );
    });
  }

  let insertedPatients: PatientRow[] = [];
  const updatedPatients: PatientRow[] = [];
  const toInsert: ParsedPatient[] = [];
  const toUpdate: ParsedPatient[] = [];

  deduplicatedPatients.forEach((patient) => {
    const key = makePatientDuplicateKey(patient);
    if (existingByKey.has(key)) {
      toUpdate.push(patient);
      return;
    }
    toInsert.push(patient);
  });

  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("patients")
      .insert(toInsert.map(toPatientInsert))
      .select("*");
    if (error) {
      console.error("Error inserting patients:", error);
      return NextResponse.json(
        { ok: false, message: `환자 신규 저장 실패: ${error.message} (Code: ${error.code})` },
        { status: 500 },
      );
    }
    insertedPatients = (data ?? []) as PatientRow[];
  }

  if (duplicateMode === "overwrite" && toUpdate.length > 0) {
    for (const patient of toUpdate) {
      const existing = existingByKey.get(makePatientDuplicateKey(patient));
      if (!existing) {
        continue;
      }

      const { data, error } = await supabase
        .from("patients")
        .update(toPatientInsert(patient))
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: `환자 업데이트 실패 (${patient.chart_number}, ${patient.visit_date}): ${error.message}`,
          },
          { status: 500 },
        );
      }
      updatedPatients.push(data as PatientRow);
    }
  }

  const validCheckups = parsed.health_checkups.filter(
    (item) => item.owner_name && item.pet_name,
  );
  if (validCheckups.length > 0) {
    const { error } = await supabase
      .from("health_checkups")
      .insert(validCheckups.map(toCheckupInsert));
    if (error) {
      return NextResponse.json(
        { ok: false, message: `건강검진 저장 실패: ${error.message}` },
        { status: 500 },
      );
    }
  }

  const touchedPatients = [...insertedPatients, ...updatedPatients];
  let remindersCreated = 0;
  if (touchedPatients.length > 0) {
    const { data: thresholdSetting } = await supabase
      .from("hospital_settings")
      .select("value")
      .eq("key", "followup_threshold")
      .maybeSingle();
    const threshold = Number(thresholdSetting?.value ?? "300000");

    const patientIds = touchedPatients.map((item) => item.id);
    await supabase
      .from("reminders")
      .delete()
      .in("patient_id", patientIds)
      .eq("status", "pending");

    const reminderRows = touchedPatients.flatMap((patient) =>
      buildRemindersForPatient(patient, Number.isFinite(threshold) ? threshold : 300000),
    );
    if (reminderRows.length > 0) {
      const { error } = await supabase.from("reminders").insert(reminderRows);
      if (!error) {
        remindersCreated = reminderRows.length;
      }
    }
  }

  const duplicateWithDbCount = toUpdate.length;
  const skippedByModeCount = duplicateMode === "skip" ? toUpdate.length : 0;

  return NextResponse.json({
    ok: true,
    duplicateMode,
    imported: {
      patients: insertedPatients.length + updatedPatients.length,
      health_checkups: validCheckups.length,
    },
    patient_result: {
      inserted: insertedPatients.length,
      updated: updatedPatients.length,
      skipped_by_mode: skippedByModeCount,
    },
    duplicate_with_db_count: duplicateWithDbCount,
    duplicate_in_file_count: duplicateInFileCount,
    skipped_invalid_count: skippedInvalidCount,
    reminders_created: remindersCreated,
    skipped_warnings: parsed.warnings.length,
  });
}
