import type { MessageTemplateType } from "@/types/message";
import type { Patient } from "@/types/patient";

export type ReminderType = "revisit_d1" | "followup_3m" | "followup_6m";
export type ReminderStatus = "pending" | "completed" | "skipped";

export type Reminder = {
  id: string;
  patient_id: string;
  type: ReminderType;
  due_date: string;
  status: ReminderStatus;
  completed_at: string | null;
  message_template_type: MessageTemplateType | null;
  created_at: string;
  updated_at: string;
};

export type ReminderWithPatient = Reminder & {
  patient: Patient;
};
