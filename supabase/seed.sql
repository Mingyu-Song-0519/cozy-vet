insert into hospital_settings (key, value)
values
  ('phone_main', '032-423-7588'),
  ('phone_mobile', '010-8661-7589'),
  ('hours_day', '09:30 ~ 21:30'),
  ('hours_night', '21:30 ~ 09:00'),
  ('holiday_policy', '연중무휴 명절당일휴무'),
  ('kakao_channel_url', 'http://pf.kakao.com/_xexfldb/chat'),
  ('followup_threshold', '300000')
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into message_templates (name, type, content, variables, footer_included, is_default)
values
  (
    '진료 후 메시지',
    'post_treatment',
    '안녕하세요 {{pet_name}} 보호자님. 약은 {{med_days}}일 동안 하루 {{med_times}}회 복용해 주세요. 안약은 {{eye_storage}} 보관, {{eye_interval}} 간격으로 하루 {{eye_times}}회 점안해 주세요. 재진은 {{revisit_date}} {{revisit_time}}입니다.',
    '{}'::jsonb,
    true,
    true
  ),
  (
    '퇴원 후 메시지',
    'post_discharge',
    '{{pet_name}} 퇴원 안내드립니다. 복약 {{med_days}}일, 하루 {{med_times}}회 부탁드립니다. 안약은 {{eye_storage}} 보관, {{eye_interval}} 간격으로 하루 {{eye_times}}회 점안해 주세요.',
    '{}'::jsonb,
    true,
    true
  ),
  ('재진 D-1 메시지', 'revisit_reminder', '{{pet_name}} 재진 일정 안내드립니다. 일시: {{revisit_date}} {{revisit_time}}', '{}'::jsonb, true, true),
  ('30만원 이상 3개월 안부', 'followup_high_3m', '{{pet_name}} 아이 컨디션은 어떠신가요? 필요 시 언제든 내원해 주세요.', '{}'::jsonb, true, true),
  ('30만원 이상 6개월 안부', 'followup_high_6m', '{{pet_name}} 아이 6개월 경과 안내드립니다. 검진 예약도 가능합니다.', '{}'::jsonb, true, true),
  ('30만원 미만 3개월 안부', 'followup_low_3m', '{{pet_name}} 아이 상태 확인차 연락드립니다. 이상 시 내원 부탁드립니다.', '{}'::jsonb, true, true),
  ('30만원 미만 6개월 안부', 'followup_low_6m', '{{pet_name}} 아이 6개월 안부 안내드립니다. 건강검진도 권장드립니다.', '{}'::jsonb, true, true)
on conflict (name) do update set
  type = excluded.type,
  content = excluded.content,
  variables = excluded.variables,
  footer_included = excluded.footer_included,
  is_default = excluded.is_default,
  updated_at = now();
