"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GroupedStats } from "@/types/statistics";

type DepartmentChartCardProps = {
  data: GroupedStats[];
};

export function DepartmentChartCard({ data }: DepartmentChartCardProps) {
  const hasData = data.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">Department Statistics</h3>
      {hasData ? (
        <>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="key" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="patient_count" fill="#0f766e" name="Patients" />
                <Bar yAxisId="right" dataKey="revenue" fill="#0ea5e9" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-1.5">Department</th>
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
        <p className="mt-3 text-sm text-slate-500">No department data in this period.</p>
      )}
    </section>
  );
}
