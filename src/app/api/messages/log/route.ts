import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageTemplateType } from "@/types/message";

const bodySchema = z.object({
  patientId: z.string().min(1),
  templateType: z.string().min(1),
  messageContent: z.string().min(1),
  reminderId: z.string().optional(),
});

export async function POST(request: Request) {
  const rawBody = (await request.json()) as unknown;
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      message: "Supabase 환경변수 미설정으로 로그 저장을 생략했습니다.",
    });
  }

  const supabase = getSupabaseServerClient();
  const payload = parsed.data;

  const { error } = await supabase.from("message_logs").insert({
    patient_id: payload.patientId,
    reminder_id: payload.reminderId ?? null,
    template_type: payload.templateType as MessageTemplateType,
    message_content: payload.messageContent,
    copied_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: `메시지 로그 저장 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
