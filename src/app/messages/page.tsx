import { MessageGenerator } from "@/components/messages/message-generator";
import { TemplateManager } from "@/components/messages/template-manager";
import type { MessageTemplateType } from "@/types/message";

type MessagesPageProps = {
  searchParams: Promise<{
    patientId?: string;
    templateType?: string;
  }>;
};

function normalizeTemplateType(value: string | undefined): MessageTemplateType {
  const allowed: MessageTemplateType[] = [
    "post_treatment",
    "post_discharge",
    "revisit_reminder",
    "followup_high_3m",
    "followup_high_6m",
    "followup_low_3m",
    "followup_low_6m",
  ];

  if (value && allowed.includes(value as MessageTemplateType)) {
    return value as MessageTemplateType;
  }

  return "post_treatment";
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const initialPatientId = params.patientId?.trim() ?? "";
  const initialTemplateType = normalizeTemplateType(params.templateType);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">메시지 관리</h1>
        <p className="mt-1 text-sm text-slate-600">
          환자별 메시지 생성, 미리보기, 클립보드 복사, 템플릿 관리를 수행합니다.
        </p>
      </section>
      <MessageGenerator
        initialPatientId={initialPatientId}
        initialTemplateType={initialTemplateType}
      />
      <TemplateManager />
    </div>
  );
}
