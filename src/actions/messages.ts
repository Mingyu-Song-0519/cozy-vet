"use server";

import { buildFooter, renderTemplate } from "@/lib/messages/generator";
import { defaultTemplates, footerDefaults } from "@/lib/messages/templates";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageTemplateType } from "@/types/message";

async function getFooterSettings() {
  if (!hasSupabaseEnv()) {
    return footerDefaults;
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("hospital_settings")
    .select("key, value")
    .in("key", [
      "phone_main",
      "phone_mobile",
      "hours_day",
      "hours_night",
      "holiday_policy",
      "kakao_channel_url",
    ]);
  if (!data || data.length === 0) {
    return footerDefaults;
  }

  const settingsMap = new Map<string, string>();
  data.forEach((item) => settingsMap.set(item.key, item.value));

  return {
    phone_main: settingsMap.get("phone_main") ?? footerDefaults.phone_main,
    phone_mobile: settingsMap.get("phone_mobile") ?? footerDefaults.phone_mobile,
    hours_day: settingsMap.get("hours_day") ?? footerDefaults.hours_day,
    hours_night: settingsMap.get("hours_night") ?? footerDefaults.hours_night,
    holiday_policy: settingsMap.get("holiday_policy") ?? footerDefaults.holiday_policy,
    kakao_channel_url:
      settingsMap.get("kakao_channel_url") ?? footerDefaults.kakao_channel_url,
  };
}

export async function getMessagePreview(
  templateType: MessageTemplateType,
  variables: Record<string, string>,
) {
  const template = defaultTemplates.find((item) => item.type === templateType);
  if (!template) {
    throw new Error(`템플릿을 찾을 수 없습니다: ${templateType}`);
  }

  const body = renderTemplate(template.content, variables);
  const footerSettings = await getFooterSettings();
  return `${body}${template.footer_included ? buildFooter(footerSettings) : ""}`;
}

export async function generateMessage(
  patientId: string,
  templateType: MessageTemplateType,
  variables: Record<string, string>,
  reminderId?: string | null,
) {
  const content = await getMessagePreview(templateType, variables);
  const copiedAt = new Date().toISOString();

  if (hasSupabaseEnv()) {
    const supabase = getSupabaseServerClient();
    await supabase.from("message_logs").insert({
      patient_id: patientId,
      reminder_id: reminderId ?? null,
      template_type: templateType,
      message_content: content,
      copied_at: copiedAt,
    });
  }

  return {
    patientId,
    templateType,
    content,
    copiedAt,
  };
}
