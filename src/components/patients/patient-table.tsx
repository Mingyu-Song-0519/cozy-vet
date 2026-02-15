"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Patient } from "@/types/patient";
import { getCache, setCache } from "@/lib/utils/cache";
import { formatCurrency } from "@/lib/utils/format";

type PatientTableProps = {
  q?: string;
  month?: string;
};

type PatientsResponse = {
  ok: boolean;
  items?: Patient[];
  message?: string;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

const PAGE_SIZE = 20;
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

function emitPatientsRefresh() {
  window.dispatchEvent(new Event("patients:refresh"));
}

function emitPatientsEdit(patient: Patient) {
  window.dispatchEvent(new CustomEvent("patients:edit", { detail: { patient } }));
}

export function PatientTable({ q = "", month = "" }: PatientTableProps) {
  const [rows, setRows] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [q, month]);

  useEffect(() => {
    let canceled = false;

    const fetchRows = async () => {
      setIsLoading(true);
      setQueryError(null);

      try {
        const params = new URLSearchParams();
        if (q) {
          params.set("q", q);
        }
        if (month) {
          params.set("month", month);
        }
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));

        const queryString = params.toString();
        const cacheKey = `patients:list:${q}:${month}:page:${page}`;
        const response = await fetch(`/api/patients${queryString ? `?${queryString}` : ""}`);
        const payload = (await response.json()) as PatientsResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message ?? "Failed to load patients.");
        }

        if (!canceled) {
          const nextRows = payload.items ?? [];
          const nextPagination = payload.pagination;
          setRows(nextRows);
          setTotal(nextPagination?.total ?? nextRows.length);
          setTotalPages(nextPagination?.total_pages ?? 1);
          setCache(cacheKey, {
            rows: nextRows,
            pagination:
              nextPagination ?? {
                page,
                page_size: PAGE_SIZE,
                total: nextRows.length,
                total_pages: 1,
              },
          });
        }
      } catch (error) {
        if (!canceled) {
          const cacheKey = `patients:list:${q}:${month}:page:${page}`;
          const cachedPayload = getCache<{
            rows: Patient[];
            pagination: {
              page: number;
              page_size: number;
              total: number;
              total_pages: number;
            };
          }>(cacheKey, CACHE_MAX_AGE_MS);

          if (cachedPayload) {
            setRows(cachedPayload.rows);
            setTotal(cachedPayload.pagination.total);
            setTotalPages(cachedPayload.pagination.total_pages);
            setQueryError("Network issue detected. Showing cached data.");
            toast.info("Offline cache data is currently displayed.");
          } else {
            setRows([]);
            setQueryError(error instanceof Error ? error.message : "Failed to load patients.");
          }
        }
      } finally {
        if (!canceled) {
          setIsLoading(false);
        }
      }
    };

    fetchRows();

    const refreshHandler = () => {
      fetchRows();
    };
    window.addEventListener("patients:refresh", refreshHandler);

    return () => {
      canceled = true;
      window.removeEventListener("patients:refresh", refreshHandler);
    };
  }, [q, month, page]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">환자 목록 (Patient List)</h2>
        <span className="text-sm text-slate-600">{isLoading ? "로딩 중..." : `총 ${total}명`}</span>
      </div>

      {queryError ? (
        <p className="mb-3 rounded-md bg-rose-50 p-2 text-xs text-rose-700">로드 에러: {queryError}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">차트 번호</th>
              <th className="px-3 py-2">방문일</th>
              <th className="px-3 py-2">보호자</th>
              <th className="px-3 py-2">환자명</th>
              <th className="px-3 py-2">진료과</th>
              <th className="px-3 py-2 text-right">수납액</th>
              <th className="px-3 py-2 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  조건에 맞는 환자가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{row.chart_number}</td>
                  <td className="px-3 py-2">{row.visit_date}</td>
                  <td className="px-3 py-2">{row.owner_name}</td>
                  <td className="px-3 py-2">{row.pet_name}</td>
                  <td className="px-3 py-2">{row.department}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(row.payment_amount)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                        onClick={() => emitPatientsEdit(row)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                        onClick={async () => {
                          const confirmed = window.confirm(`${row.pet_name} 환자 데이터를 삭제하시겠습니까?`);
                          if (!confirmed) {
                            return;
                          }

                          const response = await fetch(`/api/patients/${row.id}`, {
                            method: "DELETE",
                          });
                          const payload = (await response.json()) as {
                            ok: boolean;
                            message?: string;
                          };
                          if (!response.ok || !payload.ok) {
                            toast.error(payload.message ?? "삭제에 실패했습니다.");
                            return;
                          }

                          toast.success("환자가 삭제되었습니다.");
                          emitPatientsRefresh();
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
        >
          이전
        </button>
        <span className="text-slate-600">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </section>
  );
}
