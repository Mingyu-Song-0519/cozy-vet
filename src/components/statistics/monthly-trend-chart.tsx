"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTrendStats } from "@/types/statistics";

type MonthlyTrendChartProps = {
  data: MonthlyTrendStats[];
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const hasData = data.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">Monthly Trend (Line Chart)</h3>
      {hasData ? (
        <>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_patients"
                  stroke="#0f766e"
                  strokeWidth={2}
                  name="Patients"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0284c7"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5">Month</th>
                  <th className="px-2 py-1.5 text-right">Patients</th>
                  <th className="px-2 py-1.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.month} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{item.month}</td>
                    <td className="px-2 py-1.5 text-right">{item.total_patients}</td>
                    <td className="px-2 py-1.5 text-right">{item.revenue.toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No monthly trend data in this period.</p>
      )}
    </section>
  );
}
