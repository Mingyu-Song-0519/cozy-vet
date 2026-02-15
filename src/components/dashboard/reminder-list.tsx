import { ReminderCard } from "@/components/dashboard/reminder-card";
import { getTodayReminders } from "@/actions/reminders";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { ReminderWithPatient } from "@/types/reminder";

const fallbackReminders: ReminderWithPatient[] = [
  {
    id: "r1",
    patient_id: "p1",
    type: "revisit_d1",
    due_date: "2026-02-14",
    status: "pending",
    completed_at: null,
    message_template_type: "revisit_reminder",
    created_at: "2026-02-13T00:00:00Z",
    updated_at: "2026-02-13T00:00:00Z",
    patient: {
      id: "p1",
      chart_number: "12706",
      visit_date: "2026-02-13",
      owner_name: "김OO",
      pet_name: "겨울이",
      species: "dog",
      household_type: null,
      referral_source: "internet",
      department: "내과",
      residential_area: "인천",
      naver_booking: true,
      payment_amount: 450000,
      payment_status: "paid",
      staff_in_charge: "원장",
      is_revisit: false,
      revisit_date: "2026-02-15T14:00:00Z",
      source_month: "2026-02",
      created_at: "2026-02-13T00:00:00Z",
      updated_at: "2026-02-13T00:00:00Z",
    },
  },
];

function typeLabel(type: ReminderWithPatient["type"]) {
  if (type === "revisit_d1") {
    return "재진 D-1";
  }
  if (type === "followup_3m") {
    return "3개월 안부";
  }
  return "6개월 안부";
}

export async function ReminderList() {
  const reminders = (await getTodayReminders()) as ReminderWithPatient[];
  const source =
    reminders.length > 0 ? reminders : hasSupabaseEnv() ? [] : fallbackReminders;

  const groups = source.reduce<Record<string, ReminderWithPatient[]>>((acc, item) => {
    const key = item.type;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">오늘의 할 일</h2>
        <span className="text-sm text-slate-600">{source.length}건</span>
      </div>
      <div className="space-y-4">
        {source.length === 0 ? (
          <p className="text-sm text-slate-500">오늘 처리할 리마인더가 없습니다.</p>
        ) : null}
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              {typeLabel(type as ReminderWithPatient["type"])} ({items.length})
            </h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <ReminderCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
