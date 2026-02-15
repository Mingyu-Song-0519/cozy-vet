import type { MessageTemplateType } from "@/types/message";
import { predefinedTemplateTypes, templateTypeLabels } from "@/lib/messages/catalog";

type TemplateSelectorProps = {
  value: MessageTemplateType;
  onChange: (next: MessageTemplateType) => void;
  types?: MessageTemplateType[];
};

export function TemplateSelector({
  value,
  onChange,
  types = predefinedTemplateTypes,
}: TemplateSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={[
            "rounded-md border px-3 py-2 text-left text-sm",
            value === type
              ? "border-teal-600 bg-teal-50 text-teal-900"
              : "border-slate-300 hover:bg-slate-50",
          ].join(" ")}
        >
          {templateTypeLabels[type]}
        </button>
      ))}
    </div>
  );
}
