"use server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CheckupStats,
  GroupedStats,
  MonthlyStats,
  MonthlyTrendStats,
  RevenueStats,
} from "@/types/statistics";

export async function getMonthlyStats(yearMonth: string): Promise<MonthlyStats> {
  if (!hasSupabaseEnv()) {
    return {
      new_patients: 0,
      revisits: 0,
      total_patients: 0,
    };
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from("patients").select("is_revisit").eq("source_month", yearMonth);

  const total = data?.length ?? 0;
  const revisits = (data ?? []).filter((item) => item.is_revisit).length;

  return {
    new_patients: total - revisits,
    revisits,
    total_patients: total,
  };
}

export async function getDepartmentStats(startDate: string, endDate: string): Promise<GroupedStats[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("patients")
    .select("department, payment_amount")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate);

  const grouped = new Map<string, GroupedStats>();
  (data ?? []).forEach((item) => {
    const key = item.department?.trim() || "Other";
    const current = grouped.get(key) ?? { key, patient_count: 0, revenue: 0 };
    current.patient_count += 1;
    current.revenue += item.payment_amount ?? 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.patient_count - a.patient_count);
}

export async function getReferralStats(startDate: string, endDate: string): Promise<GroupedStats[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("patients")
    .select("referral_source, payment_amount")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate);

  const grouped = new Map<string, GroupedStats>();
  (data ?? []).forEach((item) => {
    const key = item.referral_source?.trim() || "Unspecified";
    const current = grouped.get(key) ?? { key, patient_count: 0, revenue: 0 };
    current.patient_count += 1;
    current.revenue += item.payment_amount ?? 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.patient_count - a.patient_count);
}

export async function getAreaStats(startDate: string, endDate: string): Promise<GroupedStats[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("patients")
    .select("residential_area, payment_amount")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate);

  const grouped = new Map<string, GroupedStats>();
  (data ?? []).forEach((item) => {
    const key = item.residential_area?.trim() || "Unspecified";
    const current = grouped.get(key) ?? { key, patient_count: 0, revenue: 0 };
    current.patient_count += 1;
    current.revenue += item.payment_amount ?? 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.patient_count - a.patient_count);
}

export async function getRevenueStats(startDate: string, endDate: string): Promise<RevenueStats> {
  if (!hasSupabaseEnv()) {
    return {
      total_revenue: 0,
      average_payment: 0,
      above_threshold_ratio: 0,
    };
  }

  const supabase = getSupabaseServerClient();
  const [{ data: payments }, { data: thresholdSetting }] = await Promise.all([
    supabase
      .from("patients")
      .select("payment_amount")
      .gte("visit_date", startDate)
      .lte("visit_date", endDate),
    supabase.from("hospital_settings").select("value").eq("key", "followup_threshold").maybeSingle(),
  ]);

  const threshold = Number(thresholdSetting?.value ?? "300000");
  const valid = (payments ?? [])
    .map((item) => item.payment_amount)
    .filter((value): value is number => typeof value === "number");

  if (valid.length === 0) {
    return {
      total_revenue: 0,
      average_payment: 0,
      above_threshold_ratio: 0,
    };
  }

  const totalRevenue = valid.reduce((sum, value) => sum + value, 0);
  const aboveCount = valid.filter((value) => value >= threshold).length;

  return {
    total_revenue: totalRevenue,
    average_payment: Math.round(totalRevenue / valid.length),
    above_threshold_ratio: Number(((aboveCount / valid.length) * 100).toFixed(1)),
  };
}

export async function getCheckupStats(yearMonth: string): Promise<CheckupStats> {
  if (!hasSupabaseEnv()) {
    return {
      by_species: [],
      by_type: [],
      revenue: 0,
    };
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("health_checkups")
    .select("species, checkup_type, final_cost")
    .eq("source_month", yearMonth);

  const speciesMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  let revenue = 0;

  (data ?? []).forEach((item) => {
    const speciesKey = item.species?.trim() || "Unknown";
    speciesMap.set(speciesKey, (speciesMap.get(speciesKey) ?? 0) + 1);

    const typeKey = item.checkup_type?.trim() || "Unspecified";
    typeMap.set(typeKey, (typeMap.get(typeKey) ?? 0) + 1);

    revenue += item.final_cost ?? 0;
  });

  return {
    by_species: Array.from(speciesMap.entries()).map(([species, count]) => ({
      species,
      count,
    })),
    by_type: Array.from(typeMap.entries()).map(([checkup_type, count]) => ({
      checkup_type,
      count,
    })),
    revenue,
  };
}

export async function getMonthlyTrendStats(startDate: string, endDate: string): Promise<MonthlyTrendStats[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("patients")
    .select("visit_date, payment_amount")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate)
    .order("visit_date", { ascending: true });

  const grouped = new Map<string, MonthlyTrendStats>();
  (data ?? []).forEach((item) => {
    const month = item.visit_date.slice(0, 7);
    const current = grouped.get(month) ?? {
      month,
      total_patients: 0,
      revenue: 0,
    };

    current.total_patients += 1;
    current.revenue += item.payment_amount ?? 0;
    grouped.set(month, current);
  });

  return Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month));
}
