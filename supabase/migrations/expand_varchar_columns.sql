-- Supabase SQL: patients 테이블의 모든 VARCHAR 컬럼을 TEXT로 변경
-- PostgreSQL에서 TEXT는 길이 제한 없음 (성능 차이 없음)
-- Supabase Dashboard > SQL Editor에서 실행

ALTER TABLE patients ALTER COLUMN chart_number TYPE text;
ALTER TABLE patients ALTER COLUMN visit_date TYPE text;
ALTER TABLE patients ALTER COLUMN owner_name TYPE text;
ALTER TABLE patients ALTER COLUMN pet_name TYPE text;
ALTER TABLE patients ALTER COLUMN species TYPE text;
ALTER TABLE patients ALTER COLUMN household_type TYPE text;
ALTER TABLE patients ALTER COLUMN referral_source TYPE text;
ALTER TABLE patients ALTER COLUMN department TYPE text;
ALTER TABLE patients ALTER COLUMN residential_area TYPE text;
ALTER TABLE patients ALTER COLUMN payment_status TYPE text;
ALTER TABLE patients ALTER COLUMN staff_in_charge TYPE text;
ALTER TABLE patients ALTER COLUMN revisit_date TYPE text;
ALTER TABLE patients ALTER COLUMN source_month TYPE text;
