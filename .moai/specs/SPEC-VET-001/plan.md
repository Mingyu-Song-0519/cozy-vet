# SPEC-VET-001 구현 계획

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-VET-001 |
| 관련 SPEC | spec.md |

---

## 1. 마일스톤

### Primary Goal: 핵심 데이터 기반 구축

- Supabase 프로젝트 설정 및 DB 스키마 생성 (6개 테이블)
- Next.js 15 프로젝트 초기화 (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- Supabase 클라이언트 설정 (client.ts, server.ts, types.ts)
- 공통 레이아웃 (사이드바 네비게이션, 헤더)
- 병원 설정 초기 데이터 시딩

### Secondary Goal: 환자 관리 + 메시지 모듈

- Excel 파싱 로직 구현 (SheetJS, 클라이언트 사이드)
  - 월별 시트 자동 인식 (YYYY-MM 패턴 매칭)
  - 환자 데이터 영역 파싱 (Row 3~100, 컬럼 A~O)
  - 건강검진 프로모션 영역 파싱 (Row 137~176)
  - 데이터 유효성 검증 (필수 필드 체크)
- Excel 업로드 UI (드래그 앤 드롭 모달, 파싱 미리보기, 중복 처리 옵션)
- 환자 목록 페이지 (/patients) - 테이블, 검색, 필터, 페이지네이션, CRUD
- 7종 메시지 템플릿 DB 등록 및 기본 데이터 시딩
- 메시지 생성 페이지 (/messages) - 환자 선택, 유형 선택, 변수 입력, 미리보기
- 클립보드 복사 기능 + 토스트 알림
- message_logs 기록

### Tertiary Goal: 리마인더 + 통계

- 리마인더 자동 생성 로직 (환자 등록 시 트리거)
  - 재진 D-1 리마인더 (revisit_date - 1일)
  - 3개월 안부 리마인더 (visit_date + 90일)
  - 6개월 안부 리마인더 (visit_date + 180일)
  - 수납금액 기준 메시지 템플릿 유형 자동 매핑
- 대시보드 (/) - 오늘의 할 일 목록, 리마인더 그룹화, 완료/건너뛰기 처리
- 이번 달 요약 카드 (신환/재진/매출/리뷰)
- 통계 페이지 (/statistics) - 기간 필터, 탭별 통계
  - 월별 신환/재진 통계
  - 진료과목별 환자 수 + 매출
  - 내원경로별 환자 수 + 매출
  - 거주지역별 환자 분포
  - 매출 통계 (총매출, 평균, 30만원 이상 비율)
  - 건강검진 프로모션 현황
- 차트 시각화 (차트 라이브러리 선택: recharts 권장)

### Optional Goal: 품질 향상 및 확장

- 템플릿 관리 기능 (수정/추가)
- 오프라인 내성 (연결 상태 표시, 로컬 캐시)
- Supabase 실시간 구독 (리마인더 변경 시 대시보드 자동 갱신)
- 반응형 디자인 최적화 (태블릿 768px)
- 성능 최적화 (페이지 로딩 2초 이내, 데이터 조회 1초 이내)

---

## 2. 기술적 접근

### 2.1 프로젝트 구조

Next.js 15 App Router를 사용한 풀스택 구조. 서버 컴포넌트 기본, 클라이언트 컴포넌트는 인터랙션이 필요한 경우에만 사용.

### 2.2 Excel 파싱 전략

- **클라이언트 사이드 파싱**: SheetJS(xlsx)를 사용하여 브라우저에서 직접 파싱
- **이유**: Vercel Serverless Function 10초 제한 회피, 서버 메모리 절약
- **흐름**: 파일 선택 -> 클라이언트 파싱 -> 미리보기 표시 -> 서버 API로 정제된 JSON 전송 -> DB 저장
- **시트 인식**: 정규식 `/^\d{4}-\d{2}$/` 으로 월별 시트 필터링, "복사용" 제외
- **데이터 영역**: Row 3부터 시작, 빈 행(차트번호 없음) 도달 시 중단

### 2.3 메시지 생성 전략

- 템플릿은 DB(message_templates)에 저장하여 런타임 수정 가능
- 변수 플레이스홀더: `{{pet_name}}`, `{{med_days}}`, `{{med_times}}` 등
- 공통 푸터는 hospital_settings에서 동적으로 조합
- 안부 메시지 유형은 수납금액 >= 300,000 기준으로 자동 분류

### 2.4 리마인더 전략

- 환자 데이터 INSERT 시 리마인더 자동 생성 (Server Action 내부)
- 리마인더 조회는 `due_date <= today AND status = 'pending'` 쿼리
- 대시보드 접속 시 매번 fresh 데이터 조회 (ISR 불필요, 실시간성 중요)

### 2.5 통계 전략

- Supabase SQL 집계 쿼리 사용 (RPC 또는 직접 쿼리)
- 차트 라이브러리: recharts (React 친화적, 가벼움, shadcn/ui 호환)
- 기간 필터: URL searchParams로 관리하여 공유 가능

### 2.6 차트 라이브러리 선택

| 후보 | 장점 | 단점 |
|------|------|------|
| recharts | React 네이티브, 가벼움, shadcn 호환 | 복잡한 차트 한계 |
| chart.js (react-chartjs-2) | 풍부한 차트 종류 | 번들 크기 큼 |
| nivo | 아름다운 디자인 | 학습 곡선 |

**권장**: recharts - 프로젝트 규모와 요구사항에 가장 적합

---

## 3. 아키텍처 설계 방향

### 3.1 데이터 흐름

```
Excel File -> [Browser: SheetJS Parse] -> [API: Validate + Store] -> [Supabase DB]
                                                                        |
Dashboard <- [Server Action: Query] <----------------------------------+
Messages  <- [Server Action: Template + Variables] <--------------------+
Statistics <- [Server Action: Aggregate Query] <------------------------+
```

### 3.2 상태 관리

- 서버 상태: React Server Components + Server Actions (Next.js 15 기본)
- 클라이언트 상태: React useState/useReducer (복잡한 전역 상태 불필요)
- 폼 상태: React Hook Form + Zod 검증 (메시지 변수 입력, 환자 폼)

### 3.3 인증

- 단일 사용자 환경이므로 인증 미구현
- Supabase anon key로 직접 접근
- 추후 다중 사용자 필요 시 Supabase Auth 추가 가능

---

## 4. 리스크 및 대응

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| Excel 비정형 데이터 | High | 파싱 실패 시 해당 행 건너뛰기 + 경고 표시, 로그 기록 |
| SheetJS 병합셀 파싱 실패 | Medium | 병합셀 감지 로직 추가, 수동 입력 폴백 제공 |
| Supabase 무료 티어 한도 | Low | 월 100건 수준이므로 당분간 안전, 모니터링 추가 |
| Vercel 10초 제한 | Medium | Excel 파싱을 클라이언트로 이동하여 해결 |
| 클립보드 API 미지원 브라우저 | Low | execCommand 폴백, 수동 복사 안내 |

---

## 5. 의존성

| 패키지 | 용도 | 비고 |
|--------|------|------|
| next | 프레임워크 | v15 |
| react, react-dom | UI 라이브러리 | v19 |
| typescript | 타입 시스템 | v5.x |
| @supabase/supabase-js | DB 클라이언트 | latest |
| xlsx (SheetJS) | Excel 파싱 | Community Edition |
| tailwindcss | CSS 프레임워크 | v4.x |
| shadcn/ui | UI 컴포넌트 | CLI로 설치 |
| recharts | 차트 시각화 | latest |
| react-hook-form | 폼 관리 | latest |
| zod | 스키마 검증 | latest |
| sonner | 토스트 알림 | shadcn/ui 통합 |
| date-fns | 날짜 유틸리티 | latest |
| lucide-react | 아이콘 | shadcn/ui 기본 |
