import { getMonthlyStats, getRevenueStats } from "@/actions/statistics";
import { formatCurrency } from "@/lib/utils/format";

function toYearMonth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthBoundaries(yearMonth: string) {
  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const start = `${yearText}-${monthText}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${yearText}-${monthText}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

export async function StatsSummary() {
  const month = toYearMonth(new Date());
  const range = getMonthBoundaries(month);
  const [monthly, revenue] = await Promise.all([
    getMonthlyStats(month),
    getRevenueStats(range.start, range.end),
  ]);

  const cards = [
    { label: "신환", value: `${monthly.new_patients}` },
    { label: "재진", value: `${monthly.revisits}` },
    { label: "매출", value: formatCurrency(revenue.total_revenue) },
    { label: "평균 수납", value: formatCurrency(revenue.average_payment) },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="kpi">
          <p className="text-sm text-slate-600">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
