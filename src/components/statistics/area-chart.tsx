"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { GroupedStats } from "@/types/statistics";

type AreaChartCardProps = {
  data: GroupedStats[];
};

const colors = ["#0f766e", "#0ea5e9", "#2563eb", "#14b8a6", "#0284c7", "#334155"];

export function AreaChartCard({ data }: AreaChartCardProps) {
  const hasData = data.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">Residential Area Distribution</h3>
      {hasData ? (
        <>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="patient_count"
                  nameKey="key"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.key}-${entry.patient_count}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5">Area</th>
                  <th className="px-2 py-1.5 text-right">Patients</th>
                  <th className="px-2 py-1.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.key} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{item.key}</td>
                    <td className="px-2 py-1.5 text-right">{item.patient_count}</td>
                    <td className="px-2 py-1.5 text-right">{item.revenue.toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No area distribution data in this period.</p>
      )}
    </section>
  );
}
