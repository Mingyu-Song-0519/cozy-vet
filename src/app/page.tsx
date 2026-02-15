import { ReminderList } from "@/components/dashboard/reminder-list";
import { StatsSummary } from "@/components/dashboard/stats-summary";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          오늘의 업무 현황
        </h1>
      </section>
      <ReminderList />
      <StatsSummary />
    </div>
  );
}
