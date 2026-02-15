import { NextResponse } from "next/server";

export const runtime = "edge";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { buildRemindersForPatient } from "@/lib/reminders/scheduler";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const updatePatientSchema = z.object({
  chart_number: z.string().min(1).optional(),
  visit_date: z.string().min(1).optional(),
  owner_name: z.string().min(1).optional(),
  pet_name: z.string().min(1).optional(),
  species: z.enum(["dog", "cat"]).optional(),
  department: z.string().min(1).optional(),
  household_type: z.string().nullable().optional(),
  referral_source: z.string().nullable().optional(),
  residential_area: z.string().nullable().optional(),
  naver_booking: z.boolean().optional(),
  payment_amount: z.number().int().nullable().optional(),
  payment_status: z.enum(["paid", "hospitalized"]).optional(),
  staff_in_charge: z.string().nullable().optional(),
  is_revisit: z.boolean().optional(),
  revisit_date: z.string().nullable().optional(),
  source_month: z.string().nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: false,
      message: "Supabase 미연결 상태입니다.",
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
  if (error) {
    return NextResponse.json(
      { ok: false, message: `환자 조회 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, patient: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const rawBody = (await request.json()) as unknown;
  const parsed = updatePatientSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다.", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      message: "Supabase 미연결 상태로 수정은 수행하지 않았습니다.",
      patient: parsed.data,
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json(
      { ok: false, message: `환자 수정 실패: ${error.message}` },
      { status: 500 },
    );
  }

  const updatedPatient = data as Database["public"]["Tables"]["patients"]["Row"];
  const { data: thresholdSetting } = await supabase
    .from("hospital_settings")
    .select("value")
    .eq("key", "followup_threshold")
    .maybeSingle();
  const threshold = Number(thresholdSetting?.value ?? "300000");

  await supabase
    .from("reminders")
    .delete()
    .eq("patient_id", id)
    .eq("status", "pending");

  const reminders = buildRemindersForPatient(
    updatedPatient,
    Number.isFinite(threshold) ? threshold : 300000,
  );
  if (reminders.length > 0) {
    await supabase.from("reminders").insert(reminders);
  }

  return NextResponse.json({ ok: true, patient: data, reminders_created: reminders.length });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      message: "Supabase 미연결 상태로 삭제는 수행하지 않았습니다.",
    });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, message: `환자 삭제 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
