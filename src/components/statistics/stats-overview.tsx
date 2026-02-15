import type { MonthlyStats, RevenueStats } from "@/types/statistics";
import { formatCurrency } from "@/lib/utils/format";

type StatsOverviewProps = {
  monthly: MonthlyStats;
  revenue: RevenueStats;
};

export function StatsOverview({ monthly, revenue }: StatsOverviewProps) {
  const cards = [
    { label: "Total Patients", value: `${monthly.total_patients}` },
    { label: "New Patients", value: `${monthly.new_patients}` },
    { label: "Revisits", value: `${monthly.revisits}` },
    { label: "Total Revenue", value: formatCurrency(revenue.total_revenue) },
    { label: "Above 300k KRW", value: `${revenue.above_threshold_ratio}%` },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className="kpi">
          <p className="text-sm text-slate-600">{card.label}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
