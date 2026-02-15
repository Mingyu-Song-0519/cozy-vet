import { NextResponse } from "next/server";

export const runtime = "edge";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { predefinedTemplateTypes } from "@/lib/messages/catalog";
import { defaultTemplates } from "@/lib/messages/templates";
import type { MessageTemplateType } from "@/types/message";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(predefinedTemplateTypes as [MessageTemplateType, ...MessageTemplateType[]]),
  content: z.string().min(1),
  footer_included: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      ok: true,
      db_connected: false,
      items: defaultTemplates,
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, message: `템플릿 조회 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    db_connected: true,
    items: data ?? [],
  });
}

export async function POST(request: Request) {
  const rawBody = (await request.json()) as unknown;
  const parsed = createTemplateSchema.safeParse(rawBody);
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
      template: {
        id: `local-${Date.now()}`,
        ...parsed.data,
        variables: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      name: parsed.data.name,
      type: parsed.data.type,
      content: parsed.data.content,
      variables: null,
      footer_included: parsed.data.footer_included,
      is_default: parsed.data.is_default,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, message: `템플릿 생성 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, template: data });
}

