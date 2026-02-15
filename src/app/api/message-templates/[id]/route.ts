import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { predefinedTemplateTypes } from "@/lib/messages/catalog";
import type { MessageTemplateType } from "@/types/message";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z
    .enum(predefinedTemplateTypes as [MessageTemplateType, ...MessageTemplateType[]])
    .optional(),
  content: z.string().min(1).optional(),
  footer_included: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const rawBody = (await request.json()) as unknown;
  const parsed = updateTemplateSchema.safeParse(rawBody);
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
      template: parsed.data,
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("message_templates")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, message: `템플릿 수정 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, template: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
    });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, message: `템플릿 삭제 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
