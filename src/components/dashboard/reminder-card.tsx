"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ReminderWithPatient } from "@/types/reminder";

type ReminderCardProps = {
  item: ReminderWithPatient;
};

function formatReminderType(type: ReminderWithPatient["type"]) {
  if (type === "revisit_d1") {
    return "재진 D-1";
  }
  if (type === "followup_3m") {
    return "안부 3개월";
  }
  return "안부 6개월";
}

export function ReminderCard({ item }: ReminderCardProps) {
  const router = useRouter();
  const templateType = item.message_template_type ?? "revisit_reminder";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-teal-700">
        {formatReminderType(item.type)}
      </p>
      <h3 className="mt-1 text-base font-semibold">{item.patient.pet_name}</h3>
      <p className="mt-1 text-sm text-slate-600">
        {item.patient.owner_name} / 만기 {item.due_date}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/messages?patientId=${encodeURIComponent(item.patient_id)}&templateType=${encodeURIComponent(templateType)}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          메시지생성
        </Link>
        <button
          type="button"
          className="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white hover:bg-teal-700"
          onClick={async () => {
            const response = await fetch(`/api/reminders/${item.id}/complete`, {
              method: "POST",
            });
            if (!response.ok) {
              toast.error("완료 처리에 실패했습니다.");
              return;
            }
            toast.success("리마인더를 완료 처리했습니다.");
            router.refresh();
          }}
        >
          완료
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          onClick={async () => {
            const response = await fetch(`/api/reminders/${item.id}/skip`, {
              method: "POST",
            });
            if (!response.ok) {
              toast.error("건너뛰기에 실패했습니다.");
              return;
            }
            toast.success("리마인더를 건너뛰었습니다.");
            router.refresh();
          }}
        >
          건너뛰기
        </button>
      </div>
    </article>
  );
}
