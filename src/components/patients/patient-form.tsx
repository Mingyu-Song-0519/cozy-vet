"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Patient, Species } from "@/types/patient";

type PatientUpsertPayload = {
  chart_number: string;
  visit_date: string;
  owner_name: string;
  pet_name: string;
  species: Species;
  department: string;
  payment_amount: number | null;
  payment_status: "paid" | "hospitalized";
  referral_source: string | null;
  residential_area: string | null;
  naver_booking: boolean;
  is_revisit: boolean;
  revisit_date: string | null;
  staff_in_charge: string | null;
};

const initialPayload: PatientUpsertPayload = {
  chart_number: "",
  visit_date: "",
  owner_name: "",
  pet_name: "",
  species: "dog",
  department: "",
  payment_amount: null,
  payment_status: "paid",
  referral_source: null,
  residential_area: null,
  naver_booking: false,
  is_revisit: false,
  revisit_date: null,
  staff_in_charge: null,
};

function fromPatient(patient: Patient): PatientUpsertPayload {
  return {
    chart_number: patient.chart_number,
    visit_date: patient.visit_date,
    owner_name: patient.owner_name,
    pet_name: patient.pet_name,
    species: patient.species,
    department: patient.department,
    payment_amount: patient.payment_amount,
    payment_status: patient.payment_status,
    referral_source: patient.referral_source,
    residential_area: patient.residential_area,
    naver_booking: patient.naver_booking,
    is_revisit: patient.is_revisit,
    revisit_date: patient.revisit_date,
    staff_in_charge: patient.staff_in_charge,
  };
}

function emitPatientsRefresh() {
  window.dispatchEvent(new Event("patients:refresh"));
}

export function PatientForm() {
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientUpsertPayload>(initialPayload);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ patient?: Patient }>;
      const patient = custom.detail?.patient;
      if (!patient) {
        return;
      }

      setEditingPatientId(patient.id);
      setForm(fromPatient(patient));
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("patients:edit", handler as EventListener);
    return () => window.removeEventListener("patients:edit", handler as EventListener);
  }, []);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {editingPatientId ? "환자 정보 수정" : "환자 등록"}
        </h2>
        {editingPatientId ? (
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            onClick={() => {
              setEditingPatientId(null);
              setForm(initialPayload);
            }}
          >
            신규 등록 모드
          </button>
        ) : null}
      </div>

      <form
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.chart_number || !form.visit_date || !form.owner_name || !form.pet_name) {
            toast.error("필수 항목을 모두 입력해주세요.");
            return;
          }

          setIsSaving(true);
          try {
            const endpoint = editingPatientId ? `/api/patients/${editingPatientId}` : "/api/patients";
            const method = editingPatientId ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            const payload = (await response.json()) as { ok: boolean; message?: string };
            if (!response.ok || !payload.ok) {
              toast.error(payload.message ?? "저장에 실패했습니다.");
              return;
            }

            toast.success(editingPatientId ? "환자 정보가 수정되었습니다." : "환자가 등록되었습니다.");
            setEditingPatientId(null);
            setForm(initialPayload);
            emitPatientsRefresh();
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">차트 번호 *</span>
          <input
            value={form.chart_number}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, chart_number: event.currentTarget.value }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">방문일 *</span>
          <input
            type="date"
            value={form.visit_date}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, visit_date: event.currentTarget.value }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">보호자명 *</span>
          <input
            value={form.owner_name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, owner_name: event.currentTarget.value }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">환자명 *</span>
          <input
            value={form.pet_name}
            onChange={(event) => setForm((prev) => ({ ...prev, pet_name: event.currentTarget.value }))}
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">품종</span>
          <select
            value={form.species}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, species: event.currentTarget.value as Species }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="dog">강아지 (Dog)</option>
            <option value="cat">고양이 (Cat)</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">진료과 *</span>
          <input
            value={form.department}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, department: event.currentTarget.value }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">수납액</span>
          <input
            type="number"
            value={form.payment_amount ?? ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                payment_amount: event.currentTarget.value ? Number(event.currentTarget.value) : null,
              }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">담당 수의사</span>
          <input
            value={form.staff_in_charge ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, staff_in_charge: event.currentTarget.value || null }))
            }
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </label>

        <div className="col-span-full flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.naver_booking}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, naver_booking: event.currentTarget.checked }))
              }
            />
            네이버 예약
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_revisit}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, is_revisit: event.currentTarget.checked }))
              }
            />
            재진 여부
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {isSaving ? "저장 중..." : editingPatientId ? "수정사항 저장" : "환자 등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
