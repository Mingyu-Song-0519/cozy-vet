import * as XLSX from "xlsx";
import type { ParsedHealthCheckup, ParsedPatient, Species } from "@/types/patient";
import {
  type ExcelParseResult,
  type ParseWarning,
  validatePatientRequiredFields,
} from "@/lib/excel/validators";


// ─── 시트 이름 정규화 ────────────────────────────────────────────────────────
// YYYY-MM 형식 (예: 2024-01)
const PATTERN_YYYY_MM = /^(\d{4})-(\d{2})$/;
// YY년 M월 / YY년 MM월 (예: 24년 1월, 24년 11월)
const PATTERN_YY_KR = /^(\d{2})년\s*(\d{1,2})월$/;
// YYYY년 M월 / YYYY년 MM월 (예: 2024년 1월)
const PATTERN_YYYY_KR = /^(\d{4})년\s*(\d{1,2})월$/;
// M월 / MM월 (예: 3월, 12월) - 연도 정보 없음
const PATTERN_M_KR = /^(\d{1,2})월$/;

function normalizeSheetName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.includes("복사용")) {
    return null;
  }

  // 1. Check YYYY-MM
  if (PATTERN_YYYY_MM.test(trimmed)) {
    return trimmed;
  }

  // 2. Check YY년 M월
  const matchYY = trimmed.match(PATTERN_YY_KR);
  if (matchYY) {
    const year = `20${matchYY[1]}`;
    const month = matchYY[2].padStart(2, "0");
    return `${year}-${month}`;
  }

  // 3. Check YYYY년 M월
  const matchYYYY = trimmed.match(PATTERN_YYYY_KR);
  if (matchYYYY) {
    const year = matchYYYY[1];
    const month = matchYYYY[2].padStart(2, "0");
    return `${year}-${month}`;
  }

  // 4. Check M월 (연도 없는 패턴)
  const matchM = trimmed.match(PATTERN_M_KR);
  if (matchM) {
    const month = matchM[1].padStart(2, "0");
    return `unknown-${month}`;
  }

  return null;
}

// ─── 동적 헤더 감지 ──────────────────────────────────────────────────────────

// 환자 데이터의 각 필드에 해당하는 헤더 키워드 목록
// 키워드는 소문자로 비교됨
const PATIENT_HEADER_KEYWORDS: Record<string, string[]> = {
  chart_number: ["차트번호", "차트no", "차트 번호", "chart"],
  visit_date: ["내원일", "내원 일자", "내원일자", "날짜", "visit"],
  owner_name: ["보호자 이름", "보호자이름", "보호자명", "보호자", "owner"],
  pet_name: ["동물 이름", "동물이름", "환자이름", "환자명", "동물명", "pet name"],
  species: ["축종", "종류", "species"],
  household_type: ["세대", "세대유형", "마리수", "household"],
  referral_source: ["내원 경로", "내원경로", "유입경로", "referral"],
  department: ["진료과", "진료 과목", "진료과목", "department"],
  residential_area: ["거주지", "거주 지역", "area"],
  naver_booking: ["네이버예약", "네이버", "naver"],
  payment_amount: ["수납금액", "수납", "금액", "결제", "payment"],
  staff_in_charge: ["담당자", "담당", "staff"],
  is_revisit: ["재진", "재방문", "revisit"],
};

// 건강검진 데이터의 각 필드에 해당하는 헤더 키워드 목록
const CHECKUP_HEADER_KEYWORDS: Record<string, string[]> = {
  owner_name: ["보호자", "보호자명", "보호자 이름"],
  contact: ["연락처", "전화번호", "핸드폰", "contact"],
  pet_name: ["동물 이름", "동물이름", "환자명", "동물명"],
  species: ["종", "축종", "종류"],
  birth_year: ["출생연도", "출생", "생년", "birth"],
  sex: ["성별", "sex"],
  weight: ["체중", "몸무게", "weight"],
  checkup_type: ["검진유형", "검진 유형", "유형", "type"],
  base_cost: ["기본비용", "기본 비용", "base"],
  additional_cost: ["추가비용", "추가 비용", "additional"],
  final_cost: ["최종비용", "최종 비용", "final"],
  points: ["포인트", "적립", "points"],
  notes: ["비고", "메모", "notes"],
  preferred_date_1: ["희망일1", "희망 일자1", "preferred1"],
  preferred_date_2: ["희망일2", "희망 일자2", "preferred2"],
  preferred_time: ["희망시간", "시간", "time"],
  concerns: ["관심사항", "관심", "concerns"],
  completion_date: ["완료일", "검진완료", "completion"],
  review_status: ["후기", "리뷰", "review"],
};

// 헤더 매핑 결과 타입
type HeaderMap = Record<string, number>;

// 헤더 행 감지 결과
type HeaderDetectionResult = {
  headerRowIndex: number; // 헤더가 있는 행 인덱스 (0-based)
  headerMap: HeaderMap;   // 필드명 -> 컬럼 인덱스
};

/**
 * 시트의 상위 maxScanRows 행을 스캔하여 헤더 키워드를 찾고,
 * 각 필드의 컬럼 인덱스를 매핑합니다.
 */
function findHeaderRow(
  rows: unknown[][],
  keywords: Record<string, string[]>,
  requiredFields: string[],
  maxScanRows = 20,
): HeaderDetectionResult | null {
  const scanLimit = Math.min(maxScanRows, rows.length);

  for (let rowIdx = 0; rowIdx < scanLimit; rowIdx++) {
    const row = rows[rowIdx];
    if (!row || !Array.isArray(row)) continue;

    const headerMap: HeaderMap = {};
    let matchCount = 0;

    // 각 셀을 검사하여 키워드와 매칭
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellText = String(row[colIdx] ?? "").trim().toLowerCase();
      if (!cellText) continue;

      // 각 필드의 키워드와 비교
      for (const [fieldName, fieldKeywords] of Object.entries(keywords)) {
        if (headerMap[fieldName] !== undefined) continue; // 이미 매핑된 필드는 건너뜀

        const matched = fieldKeywords.some((keyword) => {
          const kw = keyword.toLowerCase();
          // 셀 텍스트에 키워드가 포함되어 있는지만 확인 (양방향 매칭 제거)
          return cellText.includes(kw);
        });

        if (matched) {
          headerMap[fieldName] = colIdx;
          matchCount++;
          break; // 이 셀은 하나의 필드에만 매핑
        }
      }
    }

    // 필수 필드 중 최소 2개 이상 매칭되면 헤더로 간주
    const requiredMatched = requiredFields.filter(
      (field) => headerMap[field] !== undefined
    ).length;

    if (requiredMatched >= 2 && matchCount >= 3) {
      console.log(`  > Header found at row ${rowIdx}: ${JSON.stringify(headerMap)}`);
      return { headerRowIndex: rowIdx, headerMap };
    }
  }

  return null;
}


// ─── 진행 상태 타입 ──────────────────────────────────────────────────────────

export type ExcelParseProgress = {
  stage: "reading" | "parsing" | "done";
  percent: number;
  current_sheet: number;
  total_sheets: number;
  sheet?: string;
};

type ProgressCallback = (progress: ExcelParseProgress) => void;

function emitProgress(onProgress: ProgressCallback | undefined, progress: ExcelParseProgress) {
  if (!onProgress) {
    return;
  }
  onProgress(progress);
}

// ─── 유틸리티 함수 ───────────────────────────────────────────────────────────

function isMostlyEmptyRow(row: unknown[], uptoIndex = 14) {
  for (let index = 0; index <= Math.min(uptoIndex, row.length - 1); index += 1) {
    const value = row[index];
    if (value == null) {
      continue;
    }
    if (typeof value === "string" && value.trim() === "") {
      continue;
    }
    return false;
  }

  return true;
}

function excelDateToIso(value: number) {
  const date = new Date(Math.round((value - 25569) * 86400 * 1000));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (typeof value === "number") {
    return excelDateToIso(value);
  }
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function asString(value: unknown) {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function toSpecies(value: unknown): Species {
  const text = asString(value);
  return text.includes("고양") ? "cat" : "dog";
}

function toBooleanO(value: unknown) {
  return asString(value).toUpperCase() === "O";
}

function parsePayment(value: unknown) {
  const text = asString(value);

  if (!text) {
    return { amount: null, status: "paid" as const };
  }
  if (text.includes("입원")) {
    return { amount: null, status: "hospitalized" as const };
  }

  const onlyDigits = text.replace(/[^\d]/g, "");
  if (!onlyDigits) {
    return { amount: null, status: "paid" as const };
  }

  return { amount: Number(onlyDigits), status: "paid" as const };
}

// 헤더에서 값을 안전하게 가져오는 헬퍼
function getField(row: unknown[], headerMap: HeaderMap, fieldName: string): unknown {
  const colIdx = headerMap[fieldName];
  if (colIdx === undefined) return undefined;
  return row[colIdx];
}

// ─── 환자 데이터 파싱 (동적 헤더 기반) ───────────────────────────────────────

function parsePatientRowDynamic(
  sourceMonth: string,
  rowNumber: number,
  row: unknown[],
  headerMap: HeaderMap,
): ParsedPatient {
  const chartNumber = asString(getField(row, headerMap, "chart_number"));
  const payment = parsePayment(getField(row, headerMap, "payment_amount"));
  const revisitText = asString(getField(row, headerMap, "is_revisit")).toLowerCase();

  return {
    chart_number: chartNumber,
    visit_date: normalizeDate(getField(row, headerMap, "visit_date")),
    owner_name: asString(getField(row, headerMap, "owner_name")),
    pet_name: asString(getField(row, headerMap, "pet_name")),
    species: toSpecies(getField(row, headerMap, "species")),
    household_type: asString(getField(row, headerMap, "household_type")) || null,
    referral_source: asString(getField(row, headerMap, "referral_source")) || null,
    department: asString(getField(row, headerMap, "department")) || "기타",
    residential_area: asString(getField(row, headerMap, "residential_area")) || null,
    naver_booking: toBooleanO(getField(row, headerMap, "naver_booking")),
    payment_amount: payment.amount,
    payment_status: payment.status,
    staff_in_charge: asString(getField(row, headerMap, "staff_in_charge")) || null,
    is_revisit: revisitText.includes("재진o") || revisitText === "o",
    revisit_date: null,
    source_month: sourceMonth,
    row_number: rowNumber,
  };
}

// ─── 건강검진 데이터 파싱 (동적 헤더 기반) ───────────────────────────────────

function parseHealthCheckupRowDynamic(
  sourceMonth: string,
  rowNumber: number,
  row: unknown[],
  headerMap: HeaderMap,
): ParsedHealthCheckup {
  return {
    owner_name: asString(getField(row, headerMap, "owner_name")),
    contact: asString(getField(row, headerMap, "contact")) || null,
    pet_name: asString(getField(row, headerMap, "pet_name")),
    species: toSpecies(getField(row, headerMap, "species")),
    birth_year: Number(asString(getField(row, headerMap, "birth_year"))) || null,
    sex: asString(getField(row, headerMap, "sex")) || null,
    weight: Number(asString(getField(row, headerMap, "weight"))) || null,
    checkup_type: asString(getField(row, headerMap, "checkup_type")) || null,
    base_cost: Number(asString(getField(row, headerMap, "base_cost")).replace(/[^\d]/g, "")) || null,
    additional_cost: Number(asString(getField(row, headerMap, "additional_cost")).replace(/[^\d]/g, "")) || null,
    final_cost: Number(asString(getField(row, headerMap, "final_cost")).replace(/[^\d]/g, "")) || null,
    points: Number(asString(getField(row, headerMap, "points")).replace(/[^\d]/g, "")) || null,
    notes: asString(getField(row, headerMap, "notes")) || null,
    preferred_date_1: normalizeDate(getField(row, headerMap, "preferred_date_1")) || null,
    preferred_date_2: normalizeDate(getField(row, headerMap, "preferred_date_2")) || null,
    preferred_time: asString(getField(row, headerMap, "preferred_time")) || null,
    concerns: asString(getField(row, headerMap, "concerns")) || null,
    completion_date: normalizeDate(getField(row, headerMap, "completion_date")) || null,
    review_status: toBooleanO(getField(row, headerMap, "review_status")),
    source_month: sourceMonth,
    row_number: rowNumber,
  };
}

// ─── 레거시 파싱 함수 (폴백용 - 고정 인덱스) ────────────────────────────────

function parsePatientRowLegacy(
  sourceMonth: string,
  rowNumber: number,
  row: unknown[],
): ParsedPatient {
  const chartNumber = asString(row[1]);
  const payment = parsePayment(row[11]);
  const revisitText = asString(row[14]).toLowerCase();

  return {
    chart_number: chartNumber,
    visit_date: normalizeDate(row[2]),
    owner_name: asString(row[3]),
    pet_name: asString(row[4]),
    species: toSpecies(row[5]),
    household_type: asString(row[6]) || null,
    referral_source: asString(row[7]) || null,
    department: asString(row[8]) || "기타",
    residential_area: asString(row[9]) || null,
    naver_booking: toBooleanO(row[10]),
    payment_amount: payment.amount,
    payment_status: payment.status,
    staff_in_charge: asString(row[12]) || null,
    is_revisit: revisitText.includes("재진o") || revisitText === "o",
    revisit_date: null,
    source_month: sourceMonth,
    row_number: rowNumber,
  };
}

// ─── 메인 파싱 로직 ──────────────────────────────────────────────────────────

// 환자 필수 필드: 이 중 최소 2개가 매칭되어야 헤더로 인식
const PATIENT_REQUIRED_FIELDS = ["chart_number", "owner_name", "pet_name", "visit_date"];
const CHECKUP_REQUIRED_FIELDS = ["owner_name", "pet_name"];

export function parseExcelBuffer(
  buffer: ArrayBuffer,
  onProgress?: ProgressCallback,
): ExcelParseResult {
  console.log("Starting Excel parsing...");
  const workbook = XLSX.read(buffer, { type: "array" });
  console.log("All sheets found:", workbook.SheetNames);

  const targetSheets = workbook.SheetNames.reduce<
    { original: string; normalized: string }[]
  >((acc, name) => {
    const normalized = normalizeSheetName(name);
    if (normalized) {
      acc.push({ original: name, normalized });
    } else {
      console.log(`Skipping sheet: "${name}" (pattern mismatch)`);
    }
    return acc;
  }, []);

  console.log("Target sheets to parse:", targetSheets);

  const totalSheets = targetSheets.length;
  emitProgress(onProgress, {
    stage: "parsing",
    percent: totalSheets === 0 ? 100 : 15,
    current_sheet: 0,
    total_sheets: totalSheets,
  });

  const patients: ParsedPatient[] = [];
  const healthCheckups: ParsedHealthCheckup[] = [];
  const warnings: ParseWarning[] = [];
  const sheetSummaries: ExcelParseResult["sheet_summaries"] = [];

  targetSheets.forEach(({ original: sheetName, normalized: sourceMonth }, index) => {
    console.log(`Parsing sheet ${index + 1}/${totalSheets}: "${sheetName}" (as ${sourceMonth})`);

    const currentSheet = index + 1;
    const baseProgress =
      totalSheets === 0
        ? 100
        : 15 + Math.round((currentSheet / totalSheets) * 80);
    emitProgress(onProgress, {
      stage: "parsing",
      percent: Math.min(baseProgress, 95),
      current_sheet: currentSheet,
      total_sheets: totalSheets,
      sheet: sheetName,
    });

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: "",
    });

    console.log(`  > Rows in sheet: ${rows.length}`);

    let patientCount = 0;
    let checkupCount = 0;
    const warningBefore = warnings.length;

    // ── 1단계: 환자 헤더 자동 감지 ──
    const patientHeader = findHeaderRow(
      rows,
      PATIENT_HEADER_KEYWORDS,
      PATIENT_REQUIRED_FIELDS,
    );

    if (patientHeader) {
      console.log(`  > Patient header detected at row ${patientHeader.headerRowIndex}`);
      console.log(`  > Patient header map:`, patientHeader.headerMap);

      // 헤더 다음 행부터 데이터 시작
      const dataStartRow = patientHeader.headerRowIndex + 1;
      const maxRows = Math.min(rows.length, dataStartRow + 500); // 최대 500행

      for (let rowIdx = dataStartRow; rowIdx < maxRows; rowIdx++) {
        const row = rows[rowIdx] ?? [];

        if (isMostlyEmptyRow(row)) {
          continue;
        }

        const chartNumber = asString(getField(row, patientHeader.headerMap, "chart_number"));

        if (!chartNumber) {
          // 차트번호가 없으면 다른 필드가 있는지 확인
          const ownerName = asString(getField(row, patientHeader.headerMap, "owner_name"));
          const petName = asString(getField(row, patientHeader.headerMap, "pet_name"));
          if (ownerName || petName) {
            warnings.push({
              sheet: sheetName,
              row: rowIdx + 1,
              message: `동물 이름 누락 or 차트번호 누락`,
            });
          }
          continue;
        }

        const patient = parsePatientRowDynamic(sourceMonth, rowIdx + 1, row, patientHeader.headerMap);
        const rowWarnings = validatePatientRequiredFields(sheetName, rowIdx + 1, patient);
        warnings.push(...rowWarnings);

        patients.push(patient);
        patientCount += 1;
      }
    } else {
      // 폴백: 레거시 고정 인덱스 방식
      console.log(`  > No patient header detected, using legacy fixed-index parsing`);

      for (let rowNumber = 3; rowNumber <= Math.min(300, rows.length); rowNumber++) {
        const row = rows[rowNumber - 1] ?? [];
        const chartNumber = asString(row[1]);

        if (isMostlyEmptyRow(row)) {
          continue;
        }
        if (!chartNumber) {
          if (asString(row[3]) || asString(row[4])) {
            warnings.push({
              sheet: sheetName,
              row: rowNumber,
              message: `Row ${rowNumber}: 차트번호 누락`,
            });
          }
          continue;
        }

        const patient = parsePatientRowLegacy(sourceMonth, rowNumber, row);
        const rowWarnings = validatePatientRequiredFields(sheetName, rowNumber, patient);
        warnings.push(...rowWarnings);

        patients.push(patient);
        patientCount += 1;
      }
    }

    // ── 2단계: 건강검진 헤더 감지 ──
    // 건강검진 데이터는 보통 시트 하단에 위치하므로 100행 이후부터 스캔
    const checkupStartScan = Math.max(100, rows.length - 100);
    const checkupRows = rows.slice(checkupStartScan);
    const checkupHeader = findHeaderRow(
      checkupRows,
      CHECKUP_HEADER_KEYWORDS,
      CHECKUP_REQUIRED_FIELDS,
    );

    if (checkupHeader) {
      const actualHeaderRow = checkupStartScan + checkupHeader.headerRowIndex;
      console.log(`  > Checkup header detected at row ${actualHeaderRow}`);

      const dataStart = actualHeaderRow + 1;
      const maxCheckupRows = Math.min(rows.length, dataStart + 100);

      for (let rowIdx = dataStart; rowIdx < maxCheckupRows; rowIdx++) {
        const row = rows[rowIdx] ?? [];
        const owner = asString(getField(row, checkupHeader.headerMap, "owner_name"));
        const petName = asString(getField(row, checkupHeader.headerMap, "pet_name"));

        if (!owner && !petName) {
          continue;
        }

        const checkup = parseHealthCheckupRowDynamic(sourceMonth, rowIdx + 1, row, checkupHeader.headerMap);
        if (!checkup.owner_name || !checkup.pet_name) {
          warnings.push({
            sheet: sheetName,
            row: rowIdx + 1,
            message: "건강검진 필수값(보호자/동물 이름) 누락",
          });
          continue;
        }

        healthCheckups.push(checkup);
        checkupCount += 1;
      }
    } else {
      console.log(`  > No checkup header detected in this sheet`);
    }

    console.log(`  > Parsed ${patientCount} patients, ${checkupCount} checkups`);

    sheetSummaries.push({
      sheet: sheetName,
      patient_count: patientCount,
      checkup_count: checkupCount,
      warning_count: warnings.length - warningBefore,
    });
  });

  emitProgress(onProgress, {
    stage: "done",
    percent: 100,
    current_sheet: totalSheets,
    total_sheets: totalSheets,
  });

  console.log(`Parsing complete. Total patients: ${patients.length}, checkups: ${healthCheckups.length}`);

  return {
    patients,
    health_checkups: healthCheckups,
    warnings,
    sheet_summaries: sheetSummaries,
  };
}

export async function parseExcelFile(file: File, onProgress?: ProgressCallback) {
  emitProgress(onProgress, {
    stage: "reading",
    percent: 5,
    current_sheet: 0,
    total_sheets: 0,
  });
  const buffer = await file.arrayBuffer();
  emitProgress(onProgress, {
    stage: "reading",
    percent: 15,
    current_sheet: 0,
    total_sheets: 0,
  });
  return parseExcelBuffer(buffer, onProgress);
}
