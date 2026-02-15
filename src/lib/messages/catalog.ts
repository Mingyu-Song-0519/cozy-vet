import type { MessageTemplateType } from "@/types/message";

export const predefinedTemplateTypes: MessageTemplateType[] = [
  "post_treatment",
  "post_discharge",
  "revisit_reminder",
  "followup_high_3m",
  "followup_high_6m",
  "followup_low_3m",
  "followup_low_6m",
];

export const templateTypeLabels: Record<MessageTemplateType, string> = {
  post_treatment: "진료 후",
  post_discharge: "퇴원 후",
  revisit_reminder: "재진 D-1",
  followup_high_3m: "안부 3개월 (30만↑)",
  followup_high_6m: "안부 6개월 (30만↑)",
  followup_low_3m: "안부 3개월 (30만↓)",
  followup_low_6m: "안부 6개월 (30만↓)",
};
