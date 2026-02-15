"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MessagePreview } from "@/components/messages/message-preview";
import { TemplateSelector } from "@/components/messages/template-selector";
import { VariableForm } from "@/components/messages/variable-form";
import {
  buildFooter,
  chooseFollowupTemplateType,
  renderTemplate,
} from "@/lib/messages/generator";
import { defaultTemplates, footerDefaults } from "@/lib/messages/templates";
import { predefinedTemplateTypes } from "@/lib/messages/catalog";
import { getCache, setCache } from "@/lib/utils/cache";
import type { MessageTemplate, MessageTemplateType } from "@/types/message";

type PatientLookupItem = {
  id: string;
  chart_number: string;
  owner_name: string;
  pet_name: string;
  visit_date: string;
  payment_amount: number | null;
  revisit_date: string | null;
};

type MessageGeneratorProps = {
  initialPatientId?: string;
  initialTemplateType?: MessageTemplateType;
};

const PATIENT_CACHE_KEY = "patients:lookup";
const TEMPLATE_CACHE_KEY = "templates:list";
const SETTINGS_CACHE_KEY = "hospital:settings";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

async function fetchPatientsApi(url: string) {
  const response = await fetch(url);
  const payload = (await response.json()) as {
    ok: boolean;
    items?: PatientLookupItem[];
  };
  if (!response.ok || !payload.ok) {
    throw new Error("환자 조회 실패");
  }
  return payload.items ?? [];
}

function toDateOnly(value: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
}

function toTimeOnly(value: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function pickFollowupMonthDelta(visitDate: string): 3 | 6 {
  const now = new Date();
  const visit = new Date(visitDate);
  const elapsed = now.getTime() - visit.getTime();
  const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));

  return elapsedDays >= 180 ? 6 : 3;
}

export function MessageGenerator({
  initialPatientId = "",
  initialTemplateType = "post_treatment",
}: MessageGeneratorProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [templateType, setTemplateType] =
    useState<MessageTemplateType>(initialTemplateType);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientLookupItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    pet_name: "",
    revisit_date: "",
    revisit_time: "",
  });
  const [footerSettings, setFooterSettings] = useState(footerDefaults);

  // 약물/안약 체크박스 상태
  const [isMedicationChecked, setIsMedicationChecked] = useState(true);
  const [isEyeDropChecked, setIsEyeDropChecked] = useState(false);

  useEffect(() => {
    let canceled = false;
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/message-templates");
        const payload = (await response.json()) as {
          ok: boolean;
          items?: MessageTemplate[];
        };
        if (!response.ok || !payload.ok) {
          return;
        }
        if (canceled) {
          return;
        }
        const items = payload.items ?? [];
        if (items.length > 0) {
          setTemplates(items);
          setCache(TEMPLATE_CACHE_KEY, items);
        }
      } catch {
        const cached = getCache<MessageTemplate[]>(TEMPLATE_CACHE_KEY, CACHE_MAX_AGE_MS);
        if (cached && cached.length > 0) {
          setTemplates(cached);
        }
      }
    };

    fetchTemplates();
    const refreshHandler = () => {
      fetchTemplates();
    };
    window.addEventListener("message-templates:updated", refreshHandler);

    return () => {
      canceled = true;
      window.removeEventListener("message-templates:updated", refreshHandler);
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/hospital-settings");
        const payload = (await response.json()) as {
          ok: boolean;
          settings?: typeof footerDefaults;
        };
        if (!response.ok || !payload.ok || !payload.settings) {
          return;
        }
        if (canceled) {
          return;
        }
        setFooterSettings(payload.settings);
        setCache(SETTINGS_CACHE_KEY, payload.settings);
      } catch {
        const cached = getCache<typeof footerDefaults>(SETTINGS_CACHE_KEY, CACHE_MAX_AGE_MS);
        if (cached) {
          setFooterSettings(cached);
        }
      }
    };

    fetchSettings();
    const refreshHandler = () => {
      fetchSettings();
    };
    window.addEventListener("hospital-settings:updated", refreshHandler);
    window.addEventListener("message-templates:updated", refreshHandler);
    return () => {
      canceled = true;
      window.removeEventListener("hospital-settings:updated", refreshHandler);
      window.removeEventListener("message-templates:updated", refreshHandler);
    };
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setIsLoadingPatients(true);
      try {
        const url = query
          ? `/api/patients/lookup?q=${encodeURIComponent(query)}`
          : "/api/patients/lookup";
        const items = await fetchPatientsApi(url);
        setPatients(items);
        setCache(PATIENT_CACHE_KEY, items);
      } catch {
        const cached = getCache<PatientLookupItem[]>(PATIENT_CACHE_KEY, CACHE_MAX_AGE_MS);
        if (cached && cached.length > 0) {
          setPatients(cached);
          toast.info("오프라인 캐시 환자 목록을 표시합니다.");
        } else {
          toast.error("환자 목록 조회에 실패했습니다.");
        }
      } finally {
        setIsLoadingPatients(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }
    const selected = patients.find((item) => item.id === selectedPatientId);
    if (!selected) {
      return;
    }

    setValues((prev) => ({
      ...prev,
      pet_name: selected.pet_name,
      revisit_date: prev.revisit_date || toDateOnly(selected.revisit_date),
      revisit_time: prev.revisit_time || toTimeOnly(selected.revisit_date),
    }));
  }, [selectedPatientId, patients]);

  useEffect(() => {
    if (!selectedPatientId && initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId, selectedPatientId]);

  useEffect(() => {
    if (!initialPatientId) {
      return;
    }
    if (patients.some((item) => item.id === initialPatientId)) {
      return;
    }

    let canceled = false;
    (async () => {
      try {
        const items = await fetchPatientsApi(
          `/api/patients/lookup?id=${encodeURIComponent(initialPatientId)}`,
        );
        if (canceled || items.length === 0) {
          return;
        }
        setPatients((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          items.forEach((item) => {
            if (!seen.has(item.id)) {
              merged.push(item);
            }
          });
          return merged;
        });
      } catch {
        // noop
      }
    })();

    return () => {
      canceled = true;
    };
  }, [initialPatientId, patients]);

  const selectedPatient = patients.find((item) => item.id === selectedPatientId) ?? null;
  const availableTypes = useMemo(() => {
    const set = new Set<MessageTemplateType>();
    templates.forEach((item) => {
      if (predefinedTemplateTypes.includes(item.type)) {
        set.add(item.type);
      }
    });
    return predefinedTemplateTypes.filter((type) => set.has(type));
  }, [templates]);

  const content = useMemo(() => {
    const template = templates.find((item) => item.type === templateType);
    if (!template) {
      return "";
    }

    // 약물/안약 섹션 동적 생성
    const medication_section = isMedicationChecked
      ? `처방된 약은 ${values.med_days || "_"}일간 하루 ${values.med_times || "_"}회 규칙적으로 급여해 주시기 바랍니다.`
      : "";

    const intervalVal = values.eye_interval;
    const intervalPhrase = intervalVal
      ? `점안 시에는 ${intervalVal} 간격을 두어`
      : "";

    const eyedrop_section = isEyeDropChecked
      ? `안약은 ${values.eye_storage || "_"} 보관해 주시고, ${intervalPhrase ? intervalPhrase + " " : ""
      }하루 ${values.eye_times || "_"}회 정도 넣어 주세요.`
      : "";

    const extendedValues = {
      ...values,
      medication_section,
      eyedrop_section,
    };

    const body = renderTemplate(template.content, extendedValues);
    return `${body}${template.footer_included ? buildFooter(footerSettings) : ""}`;
  }, [
    templateType,
    values,
    templates,
    footerSettings,
    isMedicationChecked,
    isEyeDropChecked,
  ]);

  useEffect(() => {
    if (availableTypes.length === 0) {
      return;
    }
    if (!availableTypes.includes(templateType)) {
      setTemplateType(availableTypes[0]);
    }
  }, [availableTypes, templateType]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">메시지 생성</h2>
      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            환자 검색
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            placeholder="차트번호, 보호자명, 동물 이름"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            환자 선택 {isLoadingPatients ? "(조회 중...)" : ""}
          </span>
          <select
            value={selectedPatientId}
            onChange={(event) => setSelectedPatientId(event.currentTarget.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            <option value="">선택하세요</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                [{patient.chart_number}] {patient.owner_name} - {patient.pet_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          onClick={() => {
            if (!selectedPatient) {
              toast.error("환자를 먼저 선택해 주세요.");
              return;
            }
            const monthDelta = pickFollowupMonthDelta(selectedPatient.visit_date);
            const nextTemplateType = chooseFollowupTemplateType(
              selectedPatient.payment_amount,
              monthDelta,
            );
            setTemplateType(nextTemplateType);
            toast.success(`안부 템플릿 자동 선택: ${monthDelta}개월`);
          }}
        >
          안부 템플릿 자동 선택
        </button>
        {selectedPatient ? (
          <p className="text-xs text-slate-600">
            선택 환자: {selectedPatient.owner_name} / {selectedPatient.pet_name} / 수납{" "}
            {(selectedPatient.payment_amount ?? 0).toLocaleString("ko-KR")}원
          </p>
        ) : null}
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          환자 ID (자동 입력)
        </span>
        <input
          value={selectedPatientId}
          readOnly
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          placeholder="환자를 선택하면 자동 입력됩니다."
        />
      </label>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <TemplateSelector
            value={templateType}
            onChange={setTemplateType}
            types={availableTypes.length > 0 ? availableTypes : predefinedTemplateTypes}
          />
          <VariableForm
            values={values}
            onChange={(key, value) => {
              setValues((prev) => ({ ...prev, [key]: value }));
            }}
            isMedicationChecked={isMedicationChecked}
            onMedicationCheckChange={setIsMedicationChecked}
            isEyeDropChecked={isEyeDropChecked}
            onEyeDropCheckChange={setIsEyeDropChecked}
          />
        </div>
        <MessagePreview content={content} />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="rounded-md bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(content);
              toast.success("복사 완료");

              if (selectedPatientId) {
                const response = await fetch("/api/messages/log", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    patientId: selectedPatientId,
                    templateType,
                    messageContent: content,
                  }),
                });
                if (!response.ok) {
                  toast.error("메시지 로그 저장에 실패했습니다.");
                }
              } else {
                toast.warning("환자 선택 없이 복사되어 로그는 저장하지 않았습니다.");
              }
            } catch {
              toast.error("복사에 실패했습니다.");
            }
          }}
        >
          클립보드에 복사
        </button>
      </div>
    </section>
  );
}
