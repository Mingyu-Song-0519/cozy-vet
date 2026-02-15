import { plusDays } from "@/lib/utils/date";
import { chooseFollowupTemplateType } from "@/lib/messages/generator";
import type { Database } from "@/lib/supabase/types";
import type { MessageTemplateType } from "@/types/message";

type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

function createReminder(
  patientId: string,
  type: ReminderInsert["type"],
  dueDate: string,
  messageTemplateType: MessageTemplateType,
): ReminderInsert {
  return {
    patient_id: patientId,
    type,
    due_date: dueDate,
    status: "pending",
    completed_at: null,
    message_template_type: messageTemplateType,
  };
}

export function buildRemindersForPatient(
  patient: PatientRow,
  threshold = 300000,
): ReminderInsert[] {
  const reminders: ReminderInsert[] = [];

  if (patient.revisit_date) {
    const revisitDate = patient.revisit_date.slice(0, 10);
    reminders.push(
      createReminder(patient.id, "revisit_d1", plusDays(revisitDate, -1), "revisit_reminder"),
    );
  }

  // 재진 완료 환자는 추가 안부 리마인더를 만들지 않는다.
  if (patient.is_revisit) {
    return reminders;
  }
  if (patient.payment_amount == null) {
    return reminders;
  }

  reminders.push(
    createReminder(
      patient.id,
      "followup_3m",
      plusDays(patient.visit_date, 90),
      chooseFollowupTemplateType(patient.payment_amount, 3, threshold),
    ),
  );
  reminders.push(
    createReminder(
      patient.id,
      "followup_6m",
      plusDays(patient.visit_date, 180),
      chooseFollowupTemplateType(patient.payment_amount, 6, threshold),
    ),
  );

  return reminders;
}
