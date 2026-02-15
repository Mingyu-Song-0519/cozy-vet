import Link from "next/link";
import {
  getAreaStats,
  getCheckupStats,
  getDepartmentStats,
  getMonthlyTrendStats,
  getMonthlyStats,
  getReferralStats,
  getRevenueStats,
} from "@/actions/statistics";
import { AreaChartCard } from "@/components/statistics/area-chart";
import { CheckupStats } from "@/components/statistics/checkup-stats";
import { DepartmentChartCard } from "@/components/statistics/department-chart";
import { MonthlyTrendChart } from "@/components/statistics/monthly-trend-chart";
import { ReferralChartCard } from "@/components/statistics/referral-chart";
import { StatsOverview } from "@/components/statistics/stats-overview";

type StatisticsPageProps = {
  searchParams: Promise<{
    month?: string;
    start?: string;
    end?: string;
    tab?: string;
  }>;
};

type StatisticsTab = "overview" | "department" | "referral" | "area" | "checkup";

function normalizeTab(value?: string): StatisticsTab {
  switch (value) {
    case "department":
    case "referral":
    case "area":
    case "checkup":
      return value;
    default:
      return "overview";
  }
}

function toYearMonth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthBoundaries(yearMonth: string) {
  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const now = new Date();
    return getMonthBoundaries(toYearMonth(now));
  }

  const normalizedMonth = String(month).padStart(2, "0");
  const start = `${year}-${normalizedMonth}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${normalizedMonth}-${String(endDate.getDate()).padStart(2, "0")}`;
  return { start, end };
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const params = await searchParams;
  const defaultMonth = toYearMonth(new Date());
  const month = params.month?.trim() || defaultMonth;
  const tab = normalizeTab(params.tab);
  const monthRange = getMonthBoundaries(month);
  const start = params.start?.trim() || monthRange.start;
  const end = params.end?.trim() || monthRange.end;

  const [monthly, revenue, trend, department, referral, area, checkup] = await Promise.all([
    getMonthlyStats(month),
    getRevenueStats(start, end),
    getMonthlyTrendStats(start, end),
    getDepartmentStats(start, end),
    getReferralStats(start, end),
    getAreaStats(start, end),
    getCheckupStats(month),
  ]);

  const tabs: { id: StatisticsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "department", label: "Department" },
    { id: "referral", label: "Referral" },
    { id: "area", label: "Area" },
    { id: "checkup", label: "Checkup" },
  ];

  const getTabHref = (nextTab: StatisticsTab) => {
    const query = new URLSearchParams({
      month,
      start,
      end,
      tab: nextTab,
    });
    return `/statistics?${query.toString()}`;
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review monthly, department, referral source, and residential area trends.
        </p>

        <form className="mt-4 grid gap-2 md:grid-cols-4" method="get">
          <input type="hidden" name="tab" value={tab} />

          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">Month</span>
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">Start Date</span>
            <input
              type="date"
              name="start"
              defaultValue={start}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">End Date</span>
            <input
              type="date"
              name="end"
              defaultValue={end}
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tabItem) => {
            const selected = tabItem.id === tab;
            return (
              <Link
                key={tabItem.id}
                href={getTabHref(tabItem.id)}
                className={`rounded-md px-3 py-2 text-sm ${
                  selected
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tabItem.label}
              </Link>
            );
          })}
        </div>
      </section>

      {tab === "overview" && (
        <>
          <StatsOverview monthly={monthly} revenue={revenue} />
          <MonthlyTrendChart data={trend} />
        </>
      )}
      {tab === "department" && <DepartmentChartCard data={department} />}
      {tab === "referral" && <ReferralChartCard data={referral} />}
      {tab === "area" && <AreaChartCard data={area} />}
      {tab === "checkup" && <CheckupStats data={checkup} />}
    </div>
  );
}
