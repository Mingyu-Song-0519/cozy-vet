import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { buildRemindersForPatient } from "@/lib/reminders/scheduler";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { Patient } from "@/types/patient";

const createPatientSchema = z.object({
  chart_number: z.string().min(1),
  visit_date: z.string().min(1),
  owner_name: z.string().min(1),
  pet_name: z.string().min(1),
  species: z.enum(["dog", "cat"]).default("dog"),
  department: z.string().min(1),
  household_type: z.string().optional().nullable(),
  referral_source: z.string().optional().nullable(),
  residential_area: z.string().optional().nullable(),
  naver_booking: z.boolean().default(false),
  payment_amount: z.number().int().nullable().optional(),
  payment_status: z.enum(["paid", "hospitalized"]).default("paid"),
  staff_in_charge: z.string().optional().nullable(),
  is_revisit: z.boolean().default(false),
  revisit_date: z.string().optional().nullable(),
  source_month: z.string().optional().nullable(),
});

type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

const fallbackRows: Patient[] = [
  {
    id: "p1",
    chart_number: "12706",
    visit_date: "2026-02-13",
    owner_name: "김OO",
    pet_name: "겨울이",
    species: "dog",
    household_type: "1마리",
    referral_source: "internet",
    department: "내과",
    residential_area: "인천",
    naver_booking: true,
    payment_amount: 450000,
    payment_status: "paid",
    staff_in_charge: "원장",
    is_revisit: false,
    revisit_date: "2026-02-15T14:00:00Z",
    source_month: "2026-02",
    created_at: "2026-02-13T00:00:00Z",
    updated_at: "2026-02-13T00:00:00Z",
  },
];

function normalizeMonth(value: string | null | undefined, visitDate: string) {
  if (value && value.length >= 7) {
    return value.slice(0, 7);
  }
  return visitDate.slice(0, 7);
}

function buildPatientInsert(input: z.infer<typeof createPatientSchema>): PatientInsert {
  return {
    chart_number: input.chart_number,
    visit_date: input.visit_date,
    owner_name: input.owner_name,
    pet_name: input.pet_name,
    species: input.species,
    household_type: input.household_type ?? null,
    referral_source: input.referral_source ?? null,
    department: input.department,
    residential_area: input.residential_area ?? null,
    naver_booking: input.naver_booking,
    payment_amount: input.payment_amount ?? null,
    payment_status: input.payment_status,
    staff_in_charge: input.staff_in_charge ?? null,
    is_revisit: input.is_revisit,
    revisit_date: input.revisit_date ?? null,
    source_month: normalizeMonth(input.source_month, input.visit_date),
  };
}

function getMonthRange(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return null;
  }

  const from = `${yearText}-${monthText}-01`;
  const endDate = new Date(year, monthNumber, 1);
  const to = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;

  return { from, to };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const month = url.searchParams.get("month")?.trim() ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));

  if (!hasSupabaseEnv()) {
    const filtered = fallbackRows.filter((item) => {
      const qMatch =
        !q ||
        item.chart_number.includes(q) ||
        item.owner_name.includes(q) ||
        item.pet_name.includes(q);
      const monthMatch = !month || item.visit_date.startsWith(month);
      return qMatch && monthMatch;
    });
    const total = filtered.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const items = filtered.slice(from, to);
    return NextResponse.json({
      ok: true,
      db_connected: false,
      items,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  }

  const supabase = getSupabaseServerClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("patients")
    .select("*", { count: "exact" })
    .order("visit_date", { ascending: false });

  if (q) {
    const escaped = q.replace(/,/g, " ");
    query = query.or(
      `chart_number.ilike.%${escaped}%,owner_name.ilike.%${escaped}%,pet_name.ilike.%${escaped}%`,
    );
  }

  if (month) {
    const range = getMonthRange(month);
    if (range) {
      query = query.gte("visit_date", range.from).lt("visit_date", range.to);
    }
  }

  const ranged = await query.range(from, to);
  if (ranged.error) {
    return NextResponse.json(
      { ok: false, message: `환자 조회 실패: ${ranged.error.message}` },
      { status: 500 },
    );
  }

  const total = ranged.count ?? 0;
  const items = ranged.data ?? [];
  return NextResponse.json({
    ok: true,
    db_connected: true,
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

export async function POST(request: Request) {
  const rawBody = (await request.json()) as unknown;
  const parsed = createPatientSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다.", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = buildPatientInsert(parsed.data);
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      message: "Supabase 미연결 상태로 저장은 수행하지 않았습니다.",
      patient: payload,
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("patients").insert(payload).select("*").single();
  if (error) {
    return NextResponse.json(
      { ok: false, message: `환자 생성 실패: ${error.message}` },
      { status: 500 },
    );
  }

  const insertedPatient = data as Database["public"]["Tables"]["patients"]["Row"];
  const { data: thresholdSetting } = await supabase
    .from("hospital_settings")
    .select("value")
    .eq("key", "followup_threshold")
    .maybeSingle();
  const threshold = Number(thresholdSetting?.value ?? "300000");

  const reminders = buildRemindersForPatient(
    insertedPatient,
    Number.isFinite(threshold) ? threshold : 300000,
  );
  if (reminders.length > 0) {
    await supabase.from("reminders").insert(reminders);
  }

  return NextResponse.json({ ok: true, patient: data, reminders_created: reminders.length });
}
