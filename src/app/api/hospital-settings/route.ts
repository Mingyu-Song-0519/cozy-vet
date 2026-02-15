import { NextResponse } from "next/server";

export const runtime = "edge";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { footerDefaults } from "@/lib/messages/templates";

const keys = [
  "phone_main",
  "phone_mobile",
  "hours_day",
  "hours_night",
  "holiday_policy",
  "kakao_channel_url",
  "followup_threshold",
] as const;

const updateSchema = z.object({
  key: z.enum(keys),
  value: z.string().min(1),
});

function toRecord(rows: Array<{ key: string; value: string }>) {
  const map = new Map<string, string>();
  rows.forEach((row) => map.set(row.key, row.value));

  return {
    ...footerDefaults,
    followup_threshold: map.get("followup_threshold") ?? "300000",
    phone_main: map.get("phone_main") ?? footerDefaults.phone_main,
    phone_mobile: map.get("phone_mobile") ?? footerDefaults.phone_mobile,
    hours_day: map.get("hours_day") ?? footerDefaults.hours_day,
    hours_night: map.get("hours_night") ?? footerDefaults.hours_night,
    holiday_policy: map.get("holiday_policy") ?? footerDefaults.holiday_policy,
    kakao_channel_url: map.get("kakao_channel_url") ?? footerDefaults.kakao_channel_url,
  };
}

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      db_connected: false,
      settings: {
        ...footerDefaults,
        followup_threshold: "300000",
      },
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("hospital_settings")
    .select("key, value")
    .in("key", [...keys]);
  if (error) {
    return NextResponse.json(
      { ok: false, message: `병원 설정 조회 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    db_connected: true,
    settings: toRecord((data ?? []) as Array<{ key: string; value: string }>),
  });
}

export async function PATCH(request: Request) {
  const rawBody = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다.", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, dry_run: true, setting: parsed.data });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("hospital_settings")
    .upsert({ key: parsed.data.key, value: parsed.data.value }, { onConflict: "key" });
  if (error) {
    return NextResponse.json(
      { ok: false, message: `병원 설정 저장 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

