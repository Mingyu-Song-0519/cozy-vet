# Animal Hospital Automation

코지동물의료센터 업무 자동화를 위한 Next.js 기반 웹 애플리케이션입니다.

## 기술 스택

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL)
- SheetJS (`xlsx`)
- Recharts
- Vitest

## 주요 기능

- Excel 파싱/미리보기/가져오기
  - 월별 시트 자동 인식 (`YYYY-MM`)
  - 파싱 진행률 표시(파일 읽기/시트 파싱 단계)
  - 환자 데이터 파싱
  - 건강검진 데이터 파싱
  - 경고 및 중복 처리(`skip` / `overwrite`)
- 환자 관리 CRUD
  - 검색/월 필터
  - 생성/수정/삭제
- 메시지 관리
  - 환자 선택 기반 메시지 생성
  - 변수 입력(복용일수/횟수, 안약 보관법/점안 간격/횟수, 재진일시)
  - 안부 템플릿 자동 분류
  - 클립보드 복사 및 로그 기록
  - 템플릿 조회/수정/추가
- 리마인더
  - 오늘 할 일 그룹화 표시
  - 완료/건너뛰기 처리
- 통계 대시보드
  - 월/기간 필터
  - 과목/내원경로/지역/건강검진 통계 시각화

## 시작하기

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경변수 설정

`.env.example`을 참고해 `.env.local`을 생성합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 3) Supabase 스키마/시드 반영

아래 파일을 순서대로 실행합니다.

- `supabase/schema.sql`
- `supabase/seed.sql`

### 4) 개발 서버 실행

```bash
npm run dev
```

## 품질 체크

```bash
npm run test
npm run test:coverage
npm run lint
npm run build
npm run verify
npm run verify:full
```

## 최종 테스트 가이드

로컬 개발 서버 실행:

```bash
npm run dev
```

수동 점검 시나리오:

1. `/patients`
   - `.xlsx` 파일을 드래그 앤 드롭/파일 선택으로 업로드
   - 파싱 진행률 표시, 미리보기, 중복 처리(`skip`/`overwrite`) 동작 확인
   - 환자 검색/월 필터/생성/수정/삭제 확인
2. `/messages`
   - 환자 선택 후 템플릿 선택 및 변수 입력
   - 안부 템플릿 자동 선택, 미리보기, 클립보드 복사 확인
   - 템플릿 생성/수정/삭제 및 병원 설정 수정 확인
3. `/` (대시보드)
   - 리마인더 그룹 표시, 완료/건너뛰기 처리 확인
4. `/statistics`
   - 월/기간 필터 변경 후 탭별(overview/department/referral/area/checkup) 데이터 갱신 확인
   - 차트 + 테이블/요약 표시 확인
5. 모바일 뷰
   - 하단 모바일 내비게이션으로 페이지 이동 가능 여부 확인

## 배포 가이드 (Vercel 권장)

1. Git 저장소를 원격(GitHub 등)에 푸시
2. Vercel에서 프로젝트 Import
3. Build 설정
   - Framework: `Next.js`
   - Build Command: `npm run build`
4. 환경변수 설정 (Vercel Project Settings > Environment Variables)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Supabase SQL 반영
   - `supabase/schema.sql`
   - `supabase/seed.sql`
6. 배포 후 확인
   - `npm run verify:full` 로컬 통과 상태와 동일한지 확인
   - 배포 URL에서 `/patients`, `/messages`, `/statistics` 주요 시나리오 재검증
