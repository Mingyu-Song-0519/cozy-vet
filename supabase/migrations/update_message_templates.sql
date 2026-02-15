-- Supabase SQL: message_templates 테이블 본문 업데이트 (괄호 제거 버전)
-- 사용자가 제공한 '양식.txt' 내용으로 DB 데이터를 동기화합니다.
-- 변수 주변의 괄호를 제거했습니다 (예: ({{pet_name}}) -> {{pet_name}})
-- Supabase Dashboard > SQL Editor에서 실행해주세요.

-- 1. 진료 후 메시지
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
오늘 {{pet_name}}의 진료가 모두 마무리되어 귀가하셨습니다.

●안내사항●

처방된 약은 {{med_days}}일간 하루 {{med_times}}회 규칙적으로 급여해 주시기 바랍니다.
안약은 {{eye_storage}} 보관해 주시고, {{eye_interval}} 하루 {{eye_times}}회 정도 넣어 주세요.

귀가 후에는 {{pet_name}}의 전반적인 컨디션을 잘 관찰해 주시고,
식욕 저하, 구토 등 평소와 다른 이상 증상이 확인될 경우
지체 없이 병원으로 연락 주시기 바랍니다.

{{pet_name}}의 재진일은 {{revisit_month}}월 {{revisit_day}}일 {{revisit_time}} 로 예약되셨습니다.

{{pet_name}}의 빠른 회복과 안정적인 경과를 위해 지속적으로 함께 관리하겠습니다.
감사합니다.'
WHERE type = 'post_treatment';

-- 2. 퇴원 후 메시지
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
오늘 {{pet_name}}가 퇴원하여 귀가하였습니다.

● 안내사항 ●
처방된 약은 {{med_days}}일간 하루 {{med_times}}회 규칙적으로 급여해 주시기 바랍니다.
안약은 {{eye_storage}} 보관해 주시고, {{eye_interval}} 하루 {{eye_times}}회 정도 넣어 주세요.

귀가 후에는 {{pet_name}}의 전반적인 컨디션을 잘 관찰해 주시고,
식욕 저하, 구토 등 평소와 다른 이상 증상이 확인될 경우
지체 없이 병원으로 연락 주시기 바랍니다.

{{pet_name}}의 재진일은 {{revisit_month}}월 {{revisit_day}}일 {{revisit_time}} 로 예약되셨습니다.

{{pet_name}}의 빠른 회복과 안정적인 경과를 위해 지속적으로 함께 관리하겠습니다.
감사합니다.'
WHERE type = 'post_discharge';

-- 3. 재진 D-1 메시지
UPDATE message_templates
SET content = '안녕하세요,
코지동물의료센터입니다.

{{revisit_date}}은 {{pet_name}}의 재진({{revisit_time}}) 예정일입니다.

♧예약시간 15분 경과 시 자동 취소되니 미리 연락 부탁드립니다♧'
WHERE type = 'revisit_reminder';

-- 4. 30만원 이상 3개월 안부
UPDATE message_templates
SET content = '보호자님 안녕하세요 , 코지동물의료센터입니다.

{{pet_name}} 진료 이후 컨디션은 잘 유지되고 있는지 안부 드립니다.
작은 변화라도 느껴지시면 언제든 편하게 연락 주세요.
필요 시 경과 확인이나 추가 관리도 언제든 편안하게 도와드릴게요.'
WHERE type = 'followup_high_3m';

-- 5. 30만원 이상 6개월 안부
UPDATE message_templates
SET content = '보호자님, 안녕하세요, 코지동물의료센터 입니다.
{{pet_name}} 진료 후 6개월이 경과되어 경과 확인 차 안부 인사드립니다.
그동안 {{pet_name}}는 큰 불편 없이 잘 지내고 있는지요.

이 시기에는 이전 진료 내용과 연관된 부분이나
연령·생활 환경에 따른 변화가 있는지
간단히 점검해 보시는 것을 권해드리고 있습니다.
필요 시 추적 검사나 맞춤 관리 방향도 보호자님 상황에 맞춰
충분히 설명드리며 진행해 드리고 있습니다.

편하신 일정에 맞춰 언제든 연락 주시면 도와드리겠습니다.'
WHERE type = 'followup_high_6m';

-- 6. 30만원 미만 3개월 안부
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
{{pet_name}} 진료 이후 3개월이 지나 안부 전해드립니다.
요즘 {{pet_name}} 컨디션은 전반적으로 괜찮은지 궁금합니다.

불편한 점이 있거나 확인이 필요하실 때
언제든 편하게 연락 주세요'
WHERE type = 'followup_low_3m';

-- 7. 30만원 미만 6개월 안부
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
{{pet_name}} 진료 후 6개월이 지나 안부 연락드렸어요.
요즘 {{pet_name}} 컨디션은 어떤지 궁금합니다.

특별한 증상이 없더라도
정기적으로 상태를 한 번씩 확인해 주시면
앞으로의 건강 관리에 도움이 되는 경우가 많습니다.
간단한 체크나 상담도 가능하니
편하신 일정에 맞춰 부담 없이 방문해 주세요.'
WHERE type = 'followup_low_6m';
