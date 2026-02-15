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
import type { CheckupStats as CheckupStatsData } from "@/types/statistics";
import { formatCurrency } from "@/lib/utils/format";

type CheckupStatsProps = {
  data: CheckupStatsData;
};

export function CheckupStats({ data }: CheckupStatsProps) {
  const hasSpeciesData = data.by_species.length > 0;
  const hasTypeData = data.by_type.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">Health Checkup Promotion</h3>
      <p className="mt-2 text-sm text-slate-600">Revenue: {formatCurrency(data.revenue)}</p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Requests by Species</p>
          {hasSpeciesData ? (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_species}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="species" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No data</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Distribution by Checkup Type</p>
          {hasTypeData ? (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.by_type}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="checkup_type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284c7" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No data</p>
          )}
        </div>
      </div>
    </section>
  );
}
