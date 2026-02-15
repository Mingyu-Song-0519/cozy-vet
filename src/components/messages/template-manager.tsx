"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { predefinedTemplateTypes, templateTypeLabels } from "@/lib/messages/catalog";
import { getCache, setCache } from "@/lib/utils/cache";
import type { MessageTemplate, MessageTemplateType } from "@/types/message";

type TemplateListResponse = {
  ok: boolean;
  items?: MessageTemplate[];
  message?: string;
};

type TemplateMutationResponse = {
  ok: boolean;
  template?: MessageTemplate;
  message?: string;
};

type HospitalSettings = {
  phone_main: string;
  phone_mobile: string;
  hours_day: string;
  hours_night: string;
  holiday_policy: string;
  kakao_channel_url: string;
  followup_threshold: string;
};

const TEMPLATE_CACHE_KEY = "templates:list";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const SETTINGS_CACHE_KEY = "hospital:settings";

type EditForm = {
  id: string;
  name: string;
  type: MessageTemplateType;
  content: string;
  footer_included: boolean;
  is_default: boolean;
};

const emptyCreateForm = {
  name: "",
  type: "post_treatment" as MessageTemplateType,
  content: "",
  footer_included: true,
  is_default: false,
};

function emitTemplateUpdated() {
  window.dispatchEvent(new Event("message-templates:updated"));
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) ?? null,
    [templates, selectedId],
  );

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/message-templates");
        const payload = (await response.json()) as TemplateListResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.message ?? "템플릿 조회 실패");
        }
        const items = payload.items ?? [];
        setTemplates(items);
        setCache(TEMPLATE_CACHE_KEY, items);
        if (items.length > 0) {
          const first = items[0];
          setSelectedId(first.id);
          setEditForm({
            id: first.id,
            name: first.name,
            type: first.type,
            content: first.content,
            footer_included: first.footer_included,
            is_default: first.is_default,
          });
        }
      } catch (error) {
        const cached = getCache<MessageTemplate[]>(TEMPLATE_CACHE_KEY, CACHE_MAX_AGE_MS);
        if (cached && cached.length > 0) {
          setTemplates(cached);
          setSelectedId(cached[0].id);
          setEditForm({
            id: cached[0].id,
            name: cached[0].name,
            type: cached[0].type,
            content: cached[0].content,
            footer_included: cached[0].footer_included,
            is_default: cached[0].is_default,
          });
          toast.info("오프라인 캐시 템플릿을 표시합니다.");
        } else {
          toast.error(error instanceof Error ? error.message : "템플릿 조회 실패");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/hospital-settings");
        const payload = (await response.json()) as {
          ok: boolean;
          settings?: HospitalSettings;
          message?: string;
        };
        if (!response.ok || !payload.ok || !payload.settings) {
          throw new Error(payload.message ?? "병원 설정 조회 실패");
        }
        setSettings(payload.settings);
        setCache(SETTINGS_CACHE_KEY, payload.settings);
      } catch {
        const cached = getCache<HospitalSettings>(SETTINGS_CACHE_KEY, CACHE_MAX_AGE_MS);
        if (cached) {
          setSettings(cached);
        }
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setEditForm({
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      content: selectedTemplate.content,
      footer_included: selectedTemplate.footer_included,
      is_default: selectedTemplate.is_default,
    });
  }, [selectedTemplate]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">템플릿 관리</h2>
      <p className="mt-1 text-sm text-slate-600">
        템플릿 조회/수정/추가를 관리합니다.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[260px_1fr]">
        <div className="rounded-md border border-slate-200 p-2">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            템플릿 목록 {isLoading ? "(조회 중...)" : `(${templates.length})`}
          </p>
          <div className="space-y-1">
            {templates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={[
                  "block w-full rounded px-2 py-2 text-left text-sm",
                  selectedId === item.id
                    ? "bg-teal-50 text-teal-900"
                    : "hover:bg-slate-50 text-slate-700",
                ].join(" ")}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{templateTypeLabels[item.type]}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold">선택 템플릿 수정</h3>
            {editForm ? (
              <form
                className="space-y-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const response = await fetch(`/api/message-templates/${editForm.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editForm.name,
                      type: editForm.type,
                      content: editForm.content,
                      footer_included: editForm.footer_included,
                      is_default: editForm.is_default,
                    }),
                  });
                  const payload = (await response.json()) as TemplateMutationResponse;
                  if (!response.ok || !payload.ok || !payload.template) {
                    toast.error(payload.message ?? "템플릿 저장 실패");
                    return;
                  }

                  toast.success("템플릿 저장 완료");
                  setTemplates((prev) => {
                    const next = prev.map((item) =>
                      item.id === payload.template?.id ? payload.template : item,
                    );
                    setCache(TEMPLATE_CACHE_KEY, next);
                    return next;
                  });
                  emitTemplateUpdated();
                }}
              >
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, name: event.currentTarget.value } : prev))
                  }
                  className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                  placeholder="템플릿명"
                />
                <select
                  value={editForm.type}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, type: event.currentTarget.value as MessageTemplateType }
                        : prev,
                    )
                  }
                  className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                >
                  {predefinedTemplateTypes.map((type) => (
                    <option key={type} value={type}>
                      {templateTypeLabels[type]}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={6}
                  value={editForm.content}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, content: event.currentTarget.value } : prev,
                    )
                  }
                  className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                />
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.footer_included}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, footer_included: event.currentTarget.checked } : prev,
                        )
                      }
                    />
                    푸터 포함
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.is_default}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, is_default: event.currentTarget.checked } : prev,
                        )
                      }
                    />
                    기본 템플릿
                  </label>
                </div>
                <button
                  type="submit"
                  className="rounded bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                >
                  수정 저장
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">수정할 템플릿을 선택하세요.</p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold">새 템플릿 추가</h3>
            <form
              className="space-y-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!createForm.name || !createForm.content) {
                  toast.error("템플릿명과 내용을 입력해 주세요.");
                  return;
                }

                const response = await fetch("/api/message-templates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(createForm),
                });
                const payload = (await response.json()) as TemplateMutationResponse;
                if (!response.ok || !payload.ok || !payload.template) {
                  toast.error(payload.message ?? "템플릿 추가 실패");
                  return;
                }

                toast.success("템플릿 추가 완료");
                setTemplates((prev) => {
                  const next = [...prev, payload.template as MessageTemplate];
                  setCache(TEMPLATE_CACHE_KEY, next);
                  return next;
                });
                setCreateForm(emptyCreateForm);
                emitTemplateUpdated();
              }}
            >
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, name: event.currentTarget.value }))
                }
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                placeholder="템플릿명"
              />
              <select
                value={createForm.type}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    type: event.currentTarget.value as MessageTemplateType,
                  }))
                }
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
              >
                {predefinedTemplateTypes.map((type) => (
                  <option key={type} value={type}>
                    {templateTypeLabels[type]}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                value={createForm.content}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, content: event.currentTarget.value }))
                }
                className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                placeholder="템플릿 내용"
              />
              <button
                type="submit"
                className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                템플릿 추가
              </button>
            </form>
            {editForm ? (
              <button
                type="button"
                className="mt-2 rounded border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                onClick={async () => {
                  const confirmed = window.confirm("선택 템플릿을 삭제하시겠습니까?");
                  if (!confirmed) {
                    return;
                  }

                  const response = await fetch(`/api/message-templates/${editForm.id}`, {
                    method: "DELETE",
                  });
                  const payload = (await response.json()) as { ok: boolean; message?: string };
                  if (!response.ok || !payload.ok) {
                    toast.error(payload.message ?? "템플릿 삭제 실패");
                    return;
                  }

                  toast.success("템플릿 삭제 완료");
                  setTemplates((prev) => {
                    const next = prev.filter((item) => item.id !== editForm.id);
                    setCache(TEMPLATE_CACHE_KEY, next);
                    return next;
                  });
                  setSelectedId("");
                  setEditForm(null);
                  emitTemplateUpdated();
                }}
              >
                선택 템플릿 삭제
              </button>
            ) : null}
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <h3 className="mb-2 text-sm font-semibold">공통 푸터 설정</h3>
            {settings ? (
              <form
                className="grid gap-2 md:grid-cols-2"
                onSubmit={(event) => event.preventDefault()}
              >
                {(
                  [
                    ["phone_main", "대표 전화"],
                    ["phone_mobile", "휴대전화"],
                    ["hours_day", "주간 진료시간"],
                    ["hours_night", "야간 진료시간"],
                    ["holiday_policy", "휴무 정책"],
                    ["kakao_channel_url", "카카오 채널 URL"],
                    ["followup_threshold", "안부 기준금액"],
                  ] as Array<[keyof HospitalSettings, string]>
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                    <input
                      value={settings[key]}
                      onChange={(event) =>
                        setSettings((prev) =>
                          prev ? { ...prev, [key]: event.currentTarget.value } : prev,
                        )
                      }
                      onBlur={async () => {
                        if (!settings) {
                          return;
                        }

                        const response = await fetch("/api/hospital-settings", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ key, value: settings[key] }),
                        });
                        const payload = (await response.json()) as {
                          ok: boolean;
                          message?: string;
                        };
                        if (!response.ok || !payload.ok) {
                          toast.error(payload.message ?? "설정 저장 실패");
                          return;
                        }
                        setCache(SETTINGS_CACHE_KEY, settings);
                        window.dispatchEvent(new Event("hospital-settings:updated"));
                        toast.success("설정 저장 완료");
                      }}
                      className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
                    />
                  </label>
                ))}
              </form>
            ) : (
              <p className="text-sm text-slate-500">병원 설정을 불러오는 중입니다.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
