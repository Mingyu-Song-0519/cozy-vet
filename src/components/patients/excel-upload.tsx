"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { parseExcelFile } from "@/lib/excel/parser";
import type { ExcelParseProgress } from "@/lib/excel/parser";
import type { ExcelParseResult, ParseWarning, SheetSummary } from "@/lib/excel/validators";

type PreviewResponse = {
  ok: boolean;
  total_patients: number;
  total_health_checkups: number;
  warnings: ParseWarning[];
  sheet_summaries: SheetSummary[];
  duplicate_count: number;
  internal_duplicate_count: number;
  db_connected: boolean;
};

type ImportResponse = {
  ok: boolean;
  dry_run?: boolean;
  imported: {
    patients: number;
    health_checkups: number;
  };
  patient_result?: {
    inserted: number;
    updated: number;
    skipped_by_mode: number;
  };
  duplicate_with_db_count: number;
  duplicate_in_file_count: number;
  skipped_invalid_count: number;
  reminders_created: number;
  skipped_warnings: number;
  message?: string;
};

export function ExcelUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "overwrite">("skip");
  const [parsed, setParsed] = useState<ExcelParseResult | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseProgress, setParseProgress] = useState<ExcelParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setParsed(null);
    setPreview(null);
    setImportResult(null);
    setParseProgress(null);
    setError(null);

    setIsParsing(true);
    try {
      const parsedResult = await parseExcelFile(file, (progress) => {
        setParseProgress(progress);
      });
      setParsed(parsedResult);

      const response = await fetch("/api/excel/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed: parsedResult }),
      });
      const previewResult = (await response.json()) as PreviewResponse;
      if (!response.ok || !previewResult.ok) {
        throw new Error("Failed to generate preview.");
      }

      setPreview(previewResult);
    } catch {
      setError("An error occurred while parsing or previewing the file.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-sm font-medium">엑셀 업로드 (Excel Upload)</p>

      <div
        className={[
          "rounded-lg border border-dashed p-4 text-center transition-colors",
          isDragActive ? "border-teal-500 bg-teal-50" : "border-slate-300 bg-slate-50",
        ].join(" ")}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          const file = event.dataTransfer.files?.[0];
          if (!file) {
            return;
          }
          if (!file.name.toLowerCase().endsWith(".xlsx")) {
            setError(".xlsx 파일만 업로드 가능합니다.");
            return;
          }
          void handleFile(file);
        }}
      >
        <p className="text-sm text-slate-700">여기에 .xlsx 파일을 드래그 앤 드롭하세요</p>
        <p className="mt-1 text-xs text-slate-500">또는</p>
        <button
          type="button"
          className="mt-2 rounded-md bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
          onClick={() => inputRef.current?.click()}
        >
          파일 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) {
              return;
            }
            await handleFile(file);
          }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {fileName ? `선택된 파일: ${fileName}` : "목표: 30개 시트를 10초 내 분석"}
      </p>

      {parseProgress ? (
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded bg-slate-200">
            <div
              className="h-full bg-teal-600 transition-all"
              style={{ width: `${parseProgress.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {parseProgress.stage === "reading"
              ? "파일 읽는 중..."
              : parseProgress.stage === "done"
                ? "분석 완료"
                : `분석 중 ${parseProgress.current_sheet}/${parseProgress.total_sheets}${parseProgress.sheet ? ` (${parseProgress.sheet})` : ""}`}{" "}
            ({parseProgress.percent}%)
          </p>
        </div>
      ) : null}
      {isParsing ? <p className="mt-2 text-xs text-slate-500">분석 중...</p> : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}

      {preview ? (
        <div className="mt-3 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          <p>
            환자 수: {preview.total_patients} / 진료 기록: {preview.total_health_checkups}
          </p>
          <p>
            중복(DB): {preview.duplicate_count} / 중복(파일 내):{" "}
            {preview.internal_duplicate_count}
          </p>
          <p>경고: {preview.warnings.length}건</p>
          <p>데이터베이스: {preview.db_connected ? "연결됨" : "연결 안 됨 (드라이 런 모드)"}</p>

          <div className="space-y-1">
            <label className="block text-xs font-medium">중복 처리 방식</label>
            <select
              value={duplicateMode}
              onChange={(event) =>
                setDuplicateMode(event.currentTarget.value as "skip" | "overwrite")
              }
              className="w-full rounded border border-slate-300 bg-white px-2 py-1"
            >
              <option value="skip">중복 건너뛰기 (Skip)</option>
              <option value="overwrite">중복 덮어쓰기 (Overwrite)</option>
            </select>
          </div>

          <button
            type="button"
            disabled={!parsed || isImporting}
            onClick={async () => {
              if (!parsed) {
                return;
              }

              setIsImporting(true);
              setError(null);
              setImportResult(null);

              try {
                const response = await fetch("/api/excel/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ parsed, duplicateMode }),
                });
                const result = (await response.json()) as ImportResponse;
                if (!response.ok || !result.ok) {
                  throw new Error(result.message || "가져오기에 실패했습니다.");
                }
                setImportResult(result);
                toast.success(`${result.imported.patients}명의 환자 데이터를 성공적으로 가져왔습니다.`);
                window.dispatchEvent(new Event("patients:refresh"));
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                console.error("Import error details:", err);
                setError(`가져오기 중 오류 발생: ${errorMessage}`);
                alert(`가져오기 실패: ${errorMessage}`);
              } finally {
                setIsImporting(false);
              }
            }}
            className="rounded bg-teal-600 px-3 py-1.5 text-white disabled:opacity-60"
          >
            {isImporting ? "가져오는 중..." : "가져오기 실행"}
          </button>

          {preview.sheet_summaries.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium">시트 요약</p>
              <ul className="space-y-1">
                {preview.sheet_summaries.slice(0, 6).map((item) => (
                  <li key={item.sheet}>
                    {item.sheet}: 환자 {item.patient_count} / 진료 {item.checkup_count} /
                    경고 {item.warning_count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.warnings.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium text-rose-700">경고 미리보기 (최대 5건)</p>
              <ul className="space-y-1 text-rose-700">
                {preview.warnings.slice(0, 5).map((warning, index) => (
                  <li key={`${warning.sheet}-${warning.row}-${index}`}>
                    [{warning.sheet}] {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {importResult ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          <p>
            저장됨: 환자 {importResult.imported.patients} / 진료 기록{" "}
            {importResult.imported.health_checkups}
          </p>
          {importResult.patient_result ? (
            <p>
              (추가됨 {importResult.patient_result.inserted}, 업데이트됨{" "}
              {importResult.patient_result.updated}, 모드에 의해 건너뜀{" "}
              {importResult.patient_result.skipped_by_mode})
            </p>
          ) : null}
          <p>
            유효하지 않은 행 건너뜀: {importResult.skipped_invalid_count} / 생성된 리마인더:{" "}
            {importResult.reminders_created}
          </p>
          {importResult.message ? <p>{importResult.message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
