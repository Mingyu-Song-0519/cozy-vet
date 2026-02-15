export type MessageTemplateType =
  | "post_treatment"
  | "post_discharge"
  | "revisit_reminder"
  | "followup_high_3m"
  | "followup_high_6m"
  | "followup_low_3m"
  | "followup_low_6m";

export type MessageTemplate = {
  id: string;
  name: string;
  type: MessageTemplateType;
  content: string;
  variables: Record<string, string> | null;
  footer_included: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type MessageLog = {
  id: string;
  patient_id: string;
  reminder_id: string | null;
  template_type: MessageTemplateType;
  message_content: string;
  copied_at: string;
  created_at: string;
};
