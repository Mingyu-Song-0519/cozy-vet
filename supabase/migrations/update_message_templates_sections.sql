-- 1. 진료 후 메시지: 약물/안약 섹션 적용
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
오늘 {{pet_name}}의 진료가 모두 마무리되어 귀가하셨습니다.

●안내사항●

{{medication_section}}
{{eyedrop_section}}

귀가 후에는 {{pet_name}}의 전반적인 컨디션을 잘 관찰해 주시고,
식욕 저하, 구토 등 평소와 다른 이상 증상이 확인될 경우
지체 없이 병원으로 연락 주시기 바랍니다.

{{pet_name}}의 재진일은 {{revisit_month}}월 {{revisit_day}}일 {{revisit_time}} 로 예약되셨습니다.

{{pet_name}}의 빠른 회복과 안정적인 경과를 위해 지속적으로 함께 관리하겠습니다.
감사합니다.'
WHERE type = 'post_treatment';

-- 2. 퇴원 후 메시지: 약물/안약 섹션 적용
UPDATE message_templates
SET content = '보호자님 안녕하세요, 코지동물의료센터 입니다.
오늘 {{pet_name}}가 퇴원하여 귀가하였습니다.

● 안내사항 ●
{{medication_section}}
{{eyedrop_section}}

귀가 후에는 {{pet_name}}의 전반적인 컨디션을 잘 관찰해 주시고,
식욕 저하, 구토 등 평소와 다른 이상 증상이 확인될 경우
지체 없이 병원으로 연락 주시기 바랍니다.

{{pet_name}}의 재진일은 {{revisit_month}}월 {{revisit_day}}일 {{revisit_time}} 로 예약되셨습니다.

{{pet_name}}의 빠른 회복과 안정적인 경과를 위해 지속적으로 함께 관리하겠습니다.
감사합니다.'
WHERE type = 'post_discharge';
