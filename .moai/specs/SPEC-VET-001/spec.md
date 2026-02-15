# SPEC-VET-001: 코지동물의료센터 업무 자동화 웹 애플리케이션

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-VET-001 |
| 제목 | Cozy Animal Medical Center Workflow Automation |
| 상태 | Planned |
| 우선순위 | High |
| 생성일 | 2026-02-13 |
| 모드 | Personal |
| Lifecycle | spec-anchored |

---

## 1. 환경 (Environment)

### 1.1 비즈니스 컨텍스트

코지동물의료센터는 인천 소재 동물병원으로, 현재 다음과 같은 수동 업무 프로세스를 운영 중이다:

- **환자 데이터 관리**: Excel 파일(초진환자+검진 관리표.xlsx)에 월별 시트로 환자 정보 기록
- **메시지 발송**: 양식.txt의 7가지 템플릿을 수동으로 수정하여 카카오톡/SMS로 전송
- **통계 관리**: Excel 내 수작업 집계 (진료과목별, 거주지역별, 내원경로별)
- **건강검진 프로모션**: 별도 테이블에서 강아지/고양이 검진 관리

### 1.2 현재 데이터 구조

#### Excel 파일 구조

- **월별 시트**: 30개 (2023-03 ~ 2026-02) + 복사용 템플릿 시트
- **환자 데이터 영역** (Row 3~100):

| 컬럼 | 필드명 | 데이터 타입 | 비고 |
|------|--------|------------|------|
| A | 번호 | 순번 | 자동 증가 |
| B | 차트번호 | 문자열 | 예: 12706 |
| C | 내원날짜 | 날짜 | |
| D | 보호자 성함 | 문자열 | |
| E | 동물 이름 | 문자열 | |
| F | 환축 분류 | 열거형 | 강아지/고양이 |
| G | 가구 분류 | 열거형 | 1마리/다묘 등 |
| H | 내원경로 | 열거형 | 인터넷/지인/기타/미작성 |
| I | 진료내용 | 열거형 | 외과/내과/안과/치과/피부과/예방의학과/건강검진/기본검진/기본관리/재활/기타 |
| J | 거주구역 | 문자열 | |
| K | 네이버예약 | 불리언 | O/X |
| L | 수납금액 | 숫자/문자열 | 숫자 또는 "입원중" |
| M | 담당자 | 문자열 | |
| O | 재진여부 | 열거형 | 재진O/재진X |

- **통계 영역** (Row ~104-128): 진료과목별 건수/매출, 거주지역 분포, 내원경로별 분포 및 매출, 총매출, 네이버 리뷰 수
- **건강검진 프로모션 영역** (Row ~137-176): 강아지/고양이 별도 테이블

#### 건강검진 프로모션 테이블 필드

| 필드 | 설명 |
|------|------|
| 보호자 성함 | 보호자 이름 |
| 연락처 | 전화번호 |
| 반려동물 정보 | 출생년도, 성별, 체중, 이름 |
| 검진 종류 | 나혼자/둘이서/셋이서 검진 |
| 검진 비용 | 기본 비용 |
| 추가금액 | 추가 검사 비용 |
| 최종 결제 금액 | 총 결제액 |
| 적립금 | 적립금 정보 |
| 특이사항 | 메모 |
| 희망예약 일정 | 1순위/2순위 날짜 |
| 희망시간 | 선호 시간 |
| 걱정되는 증상 | 보호자 우려 사항 |
| 비고 | 완료일정, 리뷰, 적립금 |

#### 메시지 템플릿 (7종)

| 번호 | 템플릿명 | 변수 | 발송 조건 |
|------|----------|------|-----------|
| 1 | 진료 후 메시지 | 동물이름, 약 복용일수/횟수, 안약 보관법/횟수, 재진일시 | 진료 완료 시 |
| 2 | 퇴원 후 메시지 | 동물이름, 약 복용일수/횟수, 안약 보관법/횟수, 재진일시 | 퇴원 시 |
| 3 | 재진 메시지 (1일 전) | 날짜, 동물이름, 재진시간 | 재진일 D-1 |
| 4 | 30만원 이상 3개월 안부 | 동물이름 | 수납금액 >= 30만원, 진료 후 3개월 |
| 5 | 30만원 이상 6개월 안부 | 동물이름 | 수납금액 >= 30만원, 진료 후 6개월 |
| 6 | 30만원 미만 3개월 안부 | 동물이름 | 수납금액 < 30만원, 진료 후 3개월 |
| 7 | 30만원 미만 6개월 안부 | 동물이름 | 수납금액 < 30만원, 진료 후 6개월 |

공통 푸터: 전화번호(032-423-7588, 010-8661-7589), 진료시간(주간 09:30~21:30, 야간 21:30~09:00, 연중무휴 명절당일휴무), 카카오톡 채널 링크

### 1.3 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js | 15 |
| UI Framework | React | 19 |
| 언어 | TypeScript | 5.x |
| UI 컴포넌트 | shadcn/ui | latest |
| CSS | Tailwind CSS | 4.x |
| Backend/DB | Supabase (PostgreSQL) | - |
| Excel 처리 | SheetJS (xlsx) | latest |
| 배포 | Vercel | - |

### 1.4 페이지 구조

| 경로 | 페이지명 | 설명 |
|------|----------|------|
| / | 대시보드 | 오늘 할 일, 리마인더, 핵심 통계 |
| /patients | 환자 관리 | 환자 목록, 검색, Excel 업로드 |
| /messages | 메시지 관리 | 메시지 생성, 템플릿 관리 |
| /statistics | 통계 | 월별/진료과목/내원경로 통계, 차트 |

---

## 2. 가정 (Assumptions)

### 2.1 기술적 가정

| ID | 가정 | 신뢰도 | 근거 | 위험 |
|----|------|--------|------|------|
| A-01 | Supabase 무료 티어로 초기 운영 가능 | High | 데이터 규모 소량 (월 ~100건) | 무료 한도 초과 시 유료 전환 필요 |
| A-02 | SheetJS가 기존 Excel 파일의 모든 시트를 파싱 가능 | Medium | 표준 xlsx 형식 | 병합셀, 수식 등 복잡한 서식 파싱 실패 가능 |
| A-03 | 브라우저 Clipboard API로 메시지 복사 가능 | High | 모던 브라우저 표준 API | HTTPS 환경 필수 |
| A-04 | 단일 사용자(병원 직원) 운영 환경 | High | 사용자 요구사항 | 다중 사용자 시 동시성 처리 필요 |
| A-05 | 기존 Excel 데이터의 형식이 월별로 일관적 | Medium | 복사용 템플릿 시트 존재 | 일부 시트의 비정형 데이터 존재 가능 |

### 2.2 비즈니스 가정

| ID | 가정 | 신뢰도 | 근거 | 위험 |
|----|------|--------|------|------|
| B-01 | 메시지는 카카오톡/SMS에 수동 붙여넣기로 전달 | High | 사용자 요구사항 | 자동 발송 API 연동 불가 |
| B-02 | 안부 메시지 발송 기준은 수납금액 30만원 기준으로 분류 | High | 기존 템플릿 분류 기준 | 기준 변경 시 설정 수정 필요 |
| B-03 | 통계는 기존 Excel 통계 영역과 동일한 항목을 제공 | High | 현재 업무 프로세스 유지 | 추가 통계 요구사항 발생 가능 |

---

## 3. 요구사항 (Requirements)

### 3.1 모듈 1: Excel 업로드 및 환자 데이터 관리

#### REQ-101: Excel 파일 업로드
- **WHEN** 사용자가 Excel 파일(.xlsx)을 드래그 앤 드롭 또는 파일 선택으로 업로드하면 **THEN** 시스템은 파일을 파싱하여 월별 시트의 환자 데이터를 추출하고 데이터베이스에 저장해야 한다.

#### REQ-102: 월별 시트 자동 인식
- **WHEN** Excel 파일이 업로드되면 **THEN** 시스템은 시트 이름(YYYY-MM 형식)을 기반으로 월별 데이터를 자동 분류하고, "복사용" 템플릿 시트는 제외해야 한다.

#### REQ-103: 데이터 유효성 검증
- **WHEN** Excel 데이터가 파싱되면 **THEN** 시스템은 필수 필드(차트번호, 내원날짜, 보호자 성함, 동물 이름)의 존재 여부를 검증하고, 누락된 데이터에 대해 경고를 표시해야 한다.

#### REQ-104: 환자 목록 조회
- 시스템은 **항상** 환자 목록을 차트번호, 보호자명, 동물이름, 내원날짜 기준으로 검색 가능한 형태로 제공해야 한다.

#### REQ-105: 환자 정보 CRUD
- **WHEN** 사용자가 환자 정보를 생성/수정/삭제하면 **THEN** 시스템은 해당 변경사항을 데이터베이스에 즉시 반영하고, 관련 통계를 자동으로 재계산해야 한다.

#### REQ-106: 중복 데이터 처리
- **WHEN** 동일 차트번호와 동일 내원날짜의 데이터가 이미 존재하는 상태에서 Excel 업로드가 수행되면 **THEN** 시스템은 중복 데이터를 감지하고 사용자에게 덮어쓰기/건너뛰기 선택지를 제공해야 한다.

#### REQ-107: 건강검진 프로모션 데이터 관리
- **WHEN** Excel 파일에 건강검진 프로모션 영역(Row ~137-176)의 데이터가 포함되어 있으면 **THEN** 시스템은 강아지/고양이 검진 데이터를 별도 테이블로 파싱하여 저장해야 한다.

### 3.2 모듈 2: 메시지 자동 생성

#### REQ-201: 템플릿 기반 메시지 생성
- **WHEN** 사용자가 환자를 선택하고 메시지 유형(7종 중 1개)을 지정하면 **THEN** 시스템은 환자 데이터에서 변수를 자동 추출하여 메시지를 생성해야 한다.

#### REQ-202: 진료 후/퇴원 후 메시지 변수 입력
- **WHEN** 사용자가 진료 후 또는 퇴원 후 메시지를 생성하면 **THEN** 시스템은 약 복용일수, 복용횟수, 안약 보관법, 점안 간격, 안약 횟수, 재진일시 입력 폼을 제공하고, 동물이름은 환자 데이터에서 자동 채워야 한다.

#### REQ-203: 재진 메시지 자동 생성
- **WHEN** 사용자가 재진 메시지를 생성하면 **THEN** 시스템은 재진일, 동물이름, 재진시간을 환자 데이터와 입력값에서 자동 추출하여 메시지를 완성해야 한다.

#### REQ-204: 안부 메시지 자동 분류
- **WHEN** 사용자가 안부 메시지를 생성하면 **THEN** 시스템은 해당 환자의 수납금액을 기준으로 30만원 이상/미만을 자동 판별하고, 진료일 기준 3개월/6개월 경과 여부에 따라 적절한 템플릿을 자동 선택해야 한다.

#### REQ-205: 클립보드 복사
- **WHEN** 사용자가 생성된 메시지의 복사 버튼을 클릭하면 **THEN** 시스템은 메시지 전체 내용을 클립보드에 복사하고, 복사 완료 토스트 알림을 표시해야 한다.

#### REQ-206: 메시지 미리보기
- **WHEN** 사용자가 메시지 변수를 입력하면 **THEN** 시스템은 실시간으로 최종 메시지 미리보기를 제공하여 발송 전 내용을 확인할 수 있어야 한다.

#### REQ-207: 템플릿 관리
- 시스템은 **항상** 7종의 기본 메시지 템플릿을 제공해야 하며, **가능하면** 사용자가 템플릿 내용을 수정하고 새 템플릿을 추가할 수 있는 관리 기능을 제공해야 한다.

#### REQ-208: 공통 푸터 관리
- 시스템은 **항상** 전화번호, 진료시간, 카카오톡 채널 링크를 포함한 공통 푸터를 모든 메시지에 자동 첨부해야 한다.

### 3.3 모듈 3: 재진/안부 리마인더 스케줄링

#### REQ-301: 재진 리마인더 (D-1)
- **WHEN** 환자의 재진 예약일이 내일인 경우 **THEN** 시스템은 대시보드의 오늘 할 일 목록에 해당 환자의 재진 리마인더를 표시해야 한다.

#### REQ-302: 안부 메시지 리마인더 (3개월)
- **WHEN** 환자의 마지막 진료일로부터 3개월이 경과하면 **THEN** 시스템은 수납금액 기준(30만원 이상/미만)에 따른 3개월 안부 메시지 발송 리마인더를 대시보드에 표시해야 한다.

#### REQ-303: 안부 메시지 리마인더 (6개월)
- **WHEN** 환자의 마지막 진료일로부터 6개월이 경과하면 **THEN** 시스템은 수납금액 기준에 따른 6개월 안부 메시지 발송 리마인더를 대시보드에 표시해야 한다.

#### REQ-304: 리마인더 완료 추적
- **WHEN** 사용자가 리마인더 항목을 완료 처리하면 **THEN** 시스템은 해당 리마인더를 완료 상태로 변경하고, 완료 일시를 기록해야 한다.

#### REQ-305: 일일 작업 목록
- 시스템은 **항상** 대시보드에서 오늘 날짜 기준의 미완료 리마인더 목록을 표시하고, 유형별(재진/3개월 안부/6개월 안부)로 그룹화해야 한다.

#### REQ-306: 리마인더 자동 생성
- **WHEN** 새로운 환자 데이터가 등록되면 **THEN** 시스템은 재진일 정보가 있는 경우 재진 D-1 리마인더를, 수납금액이 있는 경우 3개월/6개월 안부 리마인더를 자동으로 생성해야 한다.

#### REQ-307: 재진 환자 리마인더 제외
- **IF** 환자가 재진으로 기록되어 있고(재진여부: 재진O) 해당 재진 방문이 이미 완료된 상태이면 **THEN** 시스템은 해당 환자에 대한 중복 안부 리마인더를 생성하지 않아야 한다.

### 3.4 모듈 4: 통계 대시보드

#### REQ-401: 월별 신환 통계
- 시스템은 **항상** 선택한 월의 신규 환자 수, 재진 환자 수, 총 환자 수를 표시해야 한다.

#### REQ-402: 진료과목별 통계
- 시스템은 **항상** 선택한 기간의 진료과목별(외과/내과/안과/치과/피부과/예방의학과/건강검진/기본검진/기본관리/재활/기타) 환자 수와 매출을 표시해야 한다.

#### REQ-403: 내원경로별 통계
- 시스템은 **항상** 선택한 기간의 내원경로별(인터넷/지인/기타/미작성) 환자 수와 매출을 차트로 시각화해야 한다.

#### REQ-404: 거주지역별 통계
- 시스템은 **항상** 선택한 기간의 거주지역별 환자 분포를 표시해야 한다.

#### REQ-405: 매출 통계
- 시스템은 **항상** 선택한 기간의 총 매출, 평균 수납금액, 30만원 이상 고객 비율을 표시해야 한다.

#### REQ-406: 건강검진 프로모션 현황
- **WHEN** 건강검진 프로모션 데이터가 존재하면 **THEN** 시스템은 강아지/고양이별 검진 신청 현황, 검진 종류별 분포, 매출 현황을 표시해야 한다.

#### REQ-407: 차트 시각화
- 시스템은 **항상** 통계 데이터를 바 차트, 파이 차트, 라인 차트 등 적절한 시각화 형태로 제공해야 한다.

#### REQ-408: 기간 필터
- **WHEN** 사용자가 통계 페이지에서 기간을 선택하면 **THEN** 시스템은 해당 기간의 데이터만 필터링하여 모든 통계를 재계산해야 한다.

### 3.5 비기능 요구사항

#### REQ-501: 응답 속도
- 시스템은 **항상** 페이지 로딩을 2초 이내, 데이터 조회를 1초 이내에 완료해야 한다.

#### REQ-502: Excel 파싱 성능
- **WHEN** 30개 시트가 포함된 Excel 파일을 업로드하면 **THEN** 시스템은 10초 이내에 파싱을 완료하고 진행률을 표시해야 한다.

#### REQ-503: 데이터 보안
- 시스템은 환자의 개인정보(보호자 성함, 연락처)를 평문으로 로그에 기록**하지 않아야 한다**.

#### REQ-504: 반응형 디자인
- 시스템은 **항상** 데스크톱(1280px 이상)과 태블릿(768px 이상) 화면에서 정상 동작해야 한다.

#### REQ-505: 오프라인 내성
- **IF** 네트워크 연결이 일시적으로 끊어지면 **THEN** 시스템은 사용자에게 연결 상태를 표시하고, 로컬 캐시된 데이터로 읽기 작업은 유지해야 한다.

---

## 4. 명세 (Specifications)

### 4.1 데이터 모델

#### 4.1.1 patients (환자)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| chart_number | varchar(20) | UNIQUE, NOT NULL | 차트번호 |
| visit_date | date | NOT NULL | 내원날짜 |
| owner_name | varchar(100) | NOT NULL | 보호자 성함 |
| pet_name | varchar(100) | NOT NULL | 동물 이름 |
| species | varchar(10) | NOT NULL | 강아지/고양이 |
| household_type | varchar(20) | | 가구 분류 |
| referral_source | varchar(20) | | 내원경로 |
| department | varchar(20) | NOT NULL | 진료과목 |
| residential_area | varchar(50) | | 거주구역 |
| naver_booking | boolean | DEFAULT false | 네이버예약 여부 |
| payment_amount | integer | | 원 단위, NULL=입원중 |
| payment_status | varchar(10) | DEFAULT 'paid' | paid/hospitalized |
| staff_in_charge | varchar(50) | | 담당자 |
| is_revisit | boolean | DEFAULT false | 재진여부 |
| revisit_date | timestamp | | 재진 예약일시 |
| source_month | varchar(7) | | 원본 시트명 (YYYY-MM) |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

인덱스: chart_number, visit_date, owner_name, source_month

#### 4.1.2 health_checkups (건강검진)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| owner_name | varchar(100) | NOT NULL | 보호자 |
| contact | varchar(20) | | 연락처 |
| pet_name | varchar(100) | NOT NULL | 동물 이름 |
| species | varchar(10) | NOT NULL | 강아지/고양이 |
| birth_year | integer | | 출생년도 |
| sex | varchar(10) | | 성별 |
| weight | decimal(5,2) | | 체중(kg) |
| checkup_type | varchar(20) | | 나혼자/둘이서/셋이서 |
| base_cost | integer | | 기본 비용 |
| additional_cost | integer | | 추가 비용 |
| final_cost | integer | | 최종 금액 |
| points | integer | | 적립금 |
| notes | text | | 특이사항 |
| preferred_date_1 | date | | 희망일 1순위 |
| preferred_date_2 | date | | 희망일 2순위 |
| preferred_time | varchar(10) | | 희망시간 |
| concerns | text | | 걱정 증상 |
| completion_date | date | | 완료일 |
| review_status | boolean | DEFAULT false | 리뷰 여부 |
| source_month | varchar(7) | | 원본 시트명 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

#### 4.1.3 message_templates (메시지 템플릿)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| name | varchar(100) | UNIQUE, NOT NULL | 템플릿명 |
| type | varchar(30) | NOT NULL | post_treatment / post_discharge / revisit_reminder / followup_high_3m / followup_high_6m / followup_low_3m / followup_low_6m |
| content | text | NOT NULL | 변수 플레이스홀더 포함 본문 |
| variables | jsonb | | 변수 목록 및 기본값 |
| footer_included | boolean | DEFAULT true | 푸터 자동 첨부 여부 |
| is_default | boolean | DEFAULT true | 기본 제공 템플릿 여부 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

#### 4.1.4 reminders (리마인더)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| patient_id | uuid | FK -> patients.id, NOT NULL | |
| type | varchar(20) | NOT NULL | revisit_d1 / followup_3m / followup_6m |
| due_date | date | NOT NULL | 리마인더 표시 날짜 |
| status | varchar(10) | DEFAULT 'pending' | pending / completed / skipped |
| completed_at | timestamp | | 완료 일시 |
| message_template_type | varchar(30) | | 연결된 메시지 템플릿 유형 |
| created_at | timestamp | DEFAULT now() | |
| updated_at | timestamp | DEFAULT now() | |

인덱스: (due_date, status), patient_id

#### 4.1.5 message_logs (메시지 발송 기록)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| patient_id | uuid | FK -> patients.id, NOT NULL | |
| reminder_id | uuid | FK -> reminders.id | 리마인더 연결 (선택) |
| template_type | varchar(30) | NOT NULL | |
| message_content | text | NOT NULL | 최종 생성된 메시지 |
| copied_at | timestamp | DEFAULT now() | 클립보드 복사 시각 |
| created_at | timestamp | DEFAULT now() | |

#### 4.1.6 hospital_settings (병원 설정)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | |
| key | varchar(50) | UNIQUE, NOT NULL | 설정 키 |
| value | text | NOT NULL | 설정 값 |
| updated_at | timestamp | DEFAULT now() | |

초기 데이터:
- phone_main: "032-423-7588"
- phone_mobile: "010-8661-7589"
- hours_day: "09:30 ~ 21:30"
- hours_night: "21:30 ~ 09:00"
- holiday_policy: "연중무휴 명절당일휴무"
- kakao_channel_url: "http://pf.kakao.com/_xexfldb/chat"
- followup_threshold: "300000" (안부 메시지 분류 기준 금액, 원)

### 4.2 API 엔드포인트 설계

Supabase Client SDK로 기본 CRUD 처리. 복잡 비즈니스 로직만 Server Action/API Route 정의.

#### 4.2.1 Excel 처리 API

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| /api/excel/upload | POST | Excel 파일 업로드 및 클라이언트 파싱 결과 수신 |
| /api/excel/preview | POST | 파싱 결과 미리보기 (저장 전 검증) |
| /api/excel/import | POST | 검증된 데이터 DB 저장 + 리마인더 자동 생성 |

#### 4.2.2 메시지 생성 (Server Actions)

| Action | 설명 |
|--------|------|
| generateMessage(patientId, templateType, variables) | 메시지 생성 + message_logs 기록 |
| getMessagePreview(templateType, variables) | 메시지 미리보기 (저장 없음) |

#### 4.2.3 리마인더 (Server Actions)

| Action | 설명 |
|--------|------|
| getTodayReminders() | 오늘 기준 미완료 리마인더 조회 (환자 정보 JOIN) |
| completeReminder(reminderId) | 리마인더 완료 처리 + completed_at 기록 |
| skipReminder(reminderId) | 리마인더 건너뛰기 |
| regenerateReminders(patientId) | 환자의 기존 pending 리마인더 삭제 후 재생성 |

#### 4.2.4 통계 (Server Actions)

| Action | 설명 |
|--------|------|
| getMonthlyStats(yearMonth) | 월별 신환/재진/총환자 통계 |
| getDepartmentStats(startDate, endDate) | 진료과목별 환자 수 + 매출 |
| getReferralStats(startDate, endDate) | 내원경로별 환자 수 + 매출 |
| getAreaStats(startDate, endDate) | 거주지역별 환자 분포 |
| getRevenueStats(startDate, endDate) | 총매출, 평균수납, 30만원 이상 비율 |
| getCheckupStats(yearMonth) | 건강검진 프로모션 현황 |

### 4.3 UI 와이어프레임

#### 4.3.1 대시보드 (/)
좌측 사이드바(대시보드/환자관리/메시지/통계) + 우측 메인 콘텐츠.
메인 상단 - 오늘의 할 일: 재진 리마인더/3개월 안부/6개월 안부 그룹별 카드 (동물이름, 보호자명, 시간/금액구간, [메시지생성][완료] 버튼).
메인 하단 - 이번 달 요약: 카드 4개 (신환 수, 재진 수, 매출, 리뷰 수).

#### 4.3.2 환자 관리 (/patients)
상단: 검색바 + [Excel 업로드] + [환자 추가] 버튼. 필터 바: 월/종류/진료과목/재진여부.
데이터 테이블: 차트번호, 내원일, 보호자, 동물이름, 종류, 진료과목, 수납금액. 페이지네이션.
Excel 업로드 모달: 드래그 앤 드롭 영역 + 파싱 미리보기 + 중복 처리 옵션(건너뛰기/덮어쓰기) + 가져오기 버튼.

#### 4.3.3 메시지 관리 (/messages)
탭: 메시지 생성 | 템플릿 관리.
메시지 생성 탭: Step1 환자 검색/선택 -> Step2 메시지 유형 선택 (5종 버튼, 안부는 수납금액 자동분류) -> Step3 추가 정보 입력 폼(좌측) -> Step4 실시간 미리보기(우측) + [클립보드에 복사] 버튼.

#### 4.3.4 통계 (/statistics)
기간 선택(시작월~종료월) + [조회]. 탭: 전체요약/진료과목/내원경로/거주지역/건강검진.
전체 요약: 카드 5개(총환자/신환/재진/매출/30만이상%) + 라인차트(월별 추이) + 파이차트(과목별 매출) + 바차트(경로별/지역별).

### 4.4 프론트엔드 컴포넌트 구조

```
src/
  app/
    layout.tsx                 -- 루트 레이아웃 (사이드바 포함)
    page.tsx                   -- 대시보드
    patients/page.tsx          -- 환자 관리
    messages/page.tsx          -- 메시지 관리
    statistics/page.tsx        -- 통계
    api/excel/
      upload/route.ts          -- Excel 업로드 API
      preview/route.ts         -- 파싱 미리보기 API
      import/route.ts          -- 데이터 가져오기 API
  components/
    layout/
      sidebar.tsx, header.tsx
    dashboard/
      reminder-list.tsx, reminder-card.tsx, stats-summary.tsx
    patients/
      patient-table.tsx, patient-form.tsx, excel-upload.tsx, patient-search.tsx
    messages/
      message-generator.tsx, template-selector.tsx, variable-form.tsx,
      message-preview.tsx, template-manager.tsx
    statistics/
      stats-overview.tsx, department-chart.tsx, referral-chart.tsx,
      area-chart.tsx, checkup-stats.tsx
  lib/
    supabase/
      client.ts, server.ts, types.ts
    excel/
      parser.ts, validators.ts
    messages/
      generator.ts, templates.ts
    utils/
      date.ts, format.ts
  actions/
    messages.ts, reminders.ts, statistics.ts
  types/
    patient.ts, message.ts, reminder.ts, statistics.ts
```

### 4.5 Supabase 설정

단일 사용자 환경이므로 RLS 활성화 + anon key 전체 접근 허용 정책 적용.
실시간 구독: 리마인더 테이블 변경 시 대시보드 자동 업데이트 (선택적).

---

## 5. 제약사항 (Constraints)

| ID | 제약사항 | 유형 |
|----|---------|------|
| C-01 | 메시지 자동 발송 불가, 클립보드 복사 후 수동 붙여넣기 | Hard |
| C-02 | Supabase 무료 티어 제한 (500MB DB, 50K MAU) | Soft |
| C-03 | Vercel 무료 티어 Serverless Function 10초 제한 | Soft |
| C-04 | Excel 파싱은 클라이언트 사이드에서 수행 (서버 메모리 제약) | Hard |
| C-05 | 기존 Excel 데이터 형식을 변경할 수 없음 | Hard |
| C-06 | 병원 운영 시간 중에도 시스템 가용성 보장 필요 | Hard |
| C-07 | 직원 IT 숙련도가 높지 않아 직관적인 UI 필요 | Soft |

---

## 6. 추적성 (Traceability)

### 요구사항-모듈 매핑

| 요구사항 | 모듈 | 페이지 | 데이터 모델 |
|----------|------|--------|------------|
| REQ-101~107 | Excel 업로드/환자 관리 | /patients | patients, health_checkups |
| REQ-201~208 | 메시지 자동 생성 | /messages | message_templates, message_logs |
| REQ-301~307 | 리마인더 스케줄링 | / (대시보드) | reminders |
| REQ-401~408 | 통계 대시보드 | /statistics | patients (집계 쿼리) |
| REQ-501~505 | 비기능 요구사항 | 전체 | - |

### 전문가 상담 권장

| 도메인 | 에이전트 | 이유 |
|--------|---------|------|
| Backend | expert-backend | Supabase RLS 정책, Server Actions 설계, Excel 파싱 전략 |
| Frontend | expert-frontend | shadcn/ui 컴포넌트 설계, 차트 라이브러리 선택, 반응형 레이아웃 |

---

## 7. 용어 사전

| 용어 | 설명 |
|------|------|
| 차트번호 | 병원 내부 환자 식별 번호 |
| 초진 | 첫 방문 환자 (재진X) |
| 재진 | 재방문 환자 (재진O) |
| 수납금액 | 진료비 결제 금액 (원 단위) |
| 안부 메시지 | 진료 후 일정 기간 경과 시 발송하는 경과 확인 메시지 |
| 내원경로 | 병원을 알게 된 경로 (인터넷, 지인 소개 등) |
| 건강검진 프로모션 | 정기 건강검진 패키지 (나혼자/둘이서/셋이서 검진) |
| D-1 | 특정일 기준 1일 전 |
