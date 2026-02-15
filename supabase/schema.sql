-- SPEC-VET-001 schema
create extension if not exists pgcrypto;

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  chart_number varchar(20) not null,
  visit_date date not null,
  owner_name varchar(100) not null,
  pet_name varchar(100) not null,
  species varchar(10) not null check (species in ('dog', 'cat')),
  household_type varchar(20),
  referral_source varchar(20),
  department varchar(20) not null,
  residential_area varchar(50),
  naver_booking boolean not null default false,
  payment_amount integer,
  payment_status varchar(10) not null default 'paid' check (payment_status in ('paid', 'hospitalized')),
  staff_in_charge varchar(50),
  is_revisit boolean not null default false,
  revisit_date timestamp,
  source_month varchar(7),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique (chart_number, visit_date)
);

create index if not exists idx_patients_chart_number on patients(chart_number);
create index if not exists idx_patients_visit_date on patients(visit_date);
create index if not exists idx_patients_owner_name on patients(owner_name);
create index if not exists idx_patients_source_month on patients(source_month);

create table if not exists health_checkups (
  id uuid primary key default gen_random_uuid(),
  owner_name varchar(100) not null,
  contact varchar(20),
  pet_name varchar(100) not null,
  species varchar(10) not null check (species in ('dog', 'cat')),
  birth_year integer,
  sex varchar(10),
  weight numeric(5, 2),
  checkup_type varchar(20),
  base_cost integer,
  additional_cost integer,
  final_cost integer,
  points integer,
  notes text,
  preferred_date_1 date,
  preferred_date_2 date,
  preferred_time varchar(10),
  concerns text,
  completion_date date,
  review_status boolean not null default false,
  source_month varchar(7),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) unique not null,
  type varchar(30) not null,
  content text not null,
  variables jsonb,
  footer_included boolean not null default true,
  is_default boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  type varchar(20) not null check (type in ('revisit_d1', 'followup_3m', 'followup_6m')),
  due_date date not null,
  status varchar(10) not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamp,
  message_template_type varchar(30),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists idx_reminders_due_status on reminders(due_date, status);
create index if not exists idx_reminders_patient_id on reminders(patient_id);

create table if not exists message_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  reminder_id uuid references reminders(id) on delete set null,
  template_type varchar(30) not null,
  message_content text not null,
  copied_at timestamp not null default now(),
  created_at timestamp not null default now()
);

create table if not exists hospital_settings (
  id uuid primary key default gen_random_uuid(),
  key varchar(50) unique not null,
  value text not null,
  updated_at timestamp not null default now()
);

alter table patients enable row level security;
alter table health_checkups enable row level security;
alter table message_templates enable row level security;
alter table reminders enable row level security;
alter table message_logs enable row level security;
alter table hospital_settings enable row level security;

drop policy if exists "allow_all_patients" on patients;
create policy "allow_all_patients" on patients for all using (true) with check (true);

drop policy if exists "allow_all_health_checkups" on health_checkups;
create policy "allow_all_health_checkups" on health_checkups for all using (true) with check (true);

drop policy if exists "allow_all_message_templates" on message_templates;
create policy "allow_all_message_templates" on message_templates for all using (true) with check (true);

drop policy if exists "allow_all_reminders" on reminders;
create policy "allow_all_reminders" on reminders for all using (true) with check (true);

drop policy if exists "allow_all_message_logs" on message_logs;
create policy "allow_all_message_logs" on message_logs for all using (true) with check (true);

drop policy if exists "allow_all_hospital_settings" on hospital_settings;
create policy "allow_all_hospital_settings" on hospital_settings for all using (true) with check (true);

