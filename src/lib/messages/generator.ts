import type { MessageTemplateType } from "@/types/message";
import { appendYi } from "@/lib/utils/hangul";
import { footerDefaults } from "@/lib/messages/templates";

const TOKEN_PATTERN = /\{\{([a-zA-Z0-9_]+)\}\}/g;

export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>,
) {
  return template.replace(TOKEN_PATTERN, (_, token: string) => {
    const value = variables[token];
    if (token === "pet_name" && typeof value === "string") {
      return appendYi(value);
    }
    return value == null ? "" : String(value);
  });
}

type FooterSettings = Partial<typeof footerDefaults>;

export function buildFooter(settings: FooterSettings = {}) {
  const merged = { ...footerDefaults, ...settings };
  return [
    "",
    `문의사항은 ${merged.phone_main} 또는 ${merged.phone_mobile} 로 연락주세요.`,
    "",
    "『진료시간』",
    `주간 진료 ${merged.hours_day}`,
    `야간 진료 ${merged.hours_night}`,
    `『연중무휴』 ${merged.holiday_policy}`,
    "",
    "카카오톡채널 바로가기",
    merged.kakao_channel_url,
  ].join("\n");
}

export function chooseFollowupTemplateType(
  paymentAmount: number | null,
  monthDelta: 3 | 6,
  threshold = 300000,
): MessageTemplateType {
  const high = (paymentAmount ?? 0) >= threshold;

  if (monthDelta === 3) {
    return high ? "followup_high_3m" : "followup_low_3m";
  }

  return high ? "followup_high_6m" : "followup_low_6m";
}
