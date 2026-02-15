export type MonthlyStats = {
  new_patients: number;
  revisits: number;
  total_patients: number;
};

export type GroupedStats = {
  key: string;
  patient_count: number;
  revenue: number;
};

export type RevenueStats = {
  total_revenue: number;
  average_payment: number;
  above_threshold_ratio: number;
};

export type MonthlyTrendStats = {
  month: string;
  total_patients: number;
  revenue: number;
};

export type CheckupStats = {
  by_species: { species: string; count: number }[];
  by_type: { checkup_type: string; count: number }[];
  revenue: number;
};
