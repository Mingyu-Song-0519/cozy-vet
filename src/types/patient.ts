export type Species = "dog" | "cat";
export type PaymentStatus = "paid" | "hospitalized";

export type Patient = {
  id: string;
  chart_number: string;
  visit_date: string;
  owner_name: string;
  pet_name: string;
  species: Species;
  household_type: string | null;
  referral_source: string | null;
  department: string;
  residential_area: string | null;
  naver_booking: boolean;
  payment_amount: number | null;
  payment_status: PaymentStatus;
  staff_in_charge: string | null;
  is_revisit: boolean;
  revisit_date: string | null;
  source_month: string | null;
  created_at: string;
  updated_at: string;
};

export type PatientInsert = Omit<Patient, "id" | "created_at" | "updated_at">;

export type HealthCheckup = {
  id: string;
  owner_name: string;
  contact: string | null;
  pet_name: string;
  species: Species;
  birth_year: number | null;
  sex: string | null;
  weight: number | null;
  checkup_type: string | null;
  base_cost: number | null;
  additional_cost: number | null;
  final_cost: number | null;
  points: number | null;
  notes: string | null;
  preferred_date_1: string | null;
  preferred_date_2: string | null;
  preferred_time: string | null;
  concerns: string | null;
  completion_date: string | null;
  review_status: boolean;
  source_month: string | null;
  created_at: string;
  updated_at: string;
};

export type ParsedPatient = PatientInsert & { row_number: number };

export type ParsedHealthCheckup = Omit<
  HealthCheckup,
  "id" | "created_at" | "updated_at"
> & {
  row_number: number;
};
