type VariableFormProps = {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  isMedicationChecked: boolean;
  onMedicationCheckChange: (checked: boolean) => void;
  isEyeDropChecked: boolean;
  onEyeDropCheckChange: (checked: boolean) => void;
};

export function VariableForm({
  values,
  onChange,
  isMedicationChecked,
  onMedicationCheckChange,
  isEyeDropChecked,
  onEyeDropCheckChange,
}: VariableFormProps) {
  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div className="rounded-md border border-slate-200 p-4">
        <h3 className="mb-3 font-semibold text-slate-800">기본 정보</h3>
        <label className="block mb-3">
          <span className="mb-1 block text-sm font-medium text-slate-700">동물 이름</span>
          <input
            value={values["pet_name"] ?? ""}
            onChange={(e) => onChange("pet_name", e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </label>
      </div>

      {/* 내복약 안내 */}
      <div className={`rounded-md border ${isMedicationChecked ? "border-teal-500 bg-teal-50/30" : "border-slate-200"} p-4 transition-colors`}>
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isMedicationChecked}
            onChange={(e) => onMedicationCheckChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="font-semibold text-slate-800">내복약 안내 포함</span>
        </label>

        {isMedicationChecked && (
          <div className="mt-3 space-y-3 pl-1">
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">복용일수</span>
              <div className="flex gap-2">
                {["7", "14", "30"].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => onChange("med_days", days)}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${values["med_days"] === days
                      ? "border-teal-500 bg-teal-100 text-teal-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {days}일
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">하루 복용 횟수</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values["med_times"] ?? ""}
                  onChange={(e) => onChange("med_times", e.target.value)}
                  className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <span className="text-sm text-slate-600">회</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* 안약 안내 */}
      <div className={`rounded-md border ${isEyeDropChecked ? "border-teal-500 bg-teal-50/30" : "border-slate-200"} p-4 transition-colors`}>
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isEyeDropChecked}
            onChange={(e) => onEyeDropCheckChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="font-semibold text-slate-800">안약 안내 포함</span>
        </label>

        {isEyeDropChecked && (
          <div className="mt-3 space-y-3 pl-1">
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">보관법</span>
              <div className="flex gap-2">
                {["냉장", "실온"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => onChange("eye_storage", method)}
                    className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${values["eye_storage"] === method
                      ? "border-teal-500 bg-teal-100 text-teal-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">점안 간격</span>
              <div className="flex flex-wrap gap-2 mb-2">
                {["5분", "10분", "15분", "30분"].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => onChange("eye_interval", time)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${values["eye_interval"] === time
                        ? "border-teal-500 bg-teal-100 text-teal-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {time}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onChange("eye_interval", "")}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${!values["eye_interval"]
                      ? "border-slate-400 bg-slate-100 text-slate-800"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  없음
                </button>
              </div>
              <input
                value={values["eye_interval"] ?? ""}
                onChange={(e) => onChange("eye_interval", e.target.value)}
                placeholder="직접 입력 (예: 1시간)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">하루 점안 횟수</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values["eye_times"] ?? ""}
                  onChange={(e) => onChange("eye_times", e.target.value)}
                  className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                <span className="text-sm text-slate-600">회</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* 재진 일정 */}
      <div className="rounded-md border border-slate-200 p-4">
        <h3 className="mb-3 font-semibold text-slate-800">재진 일정</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">재진일</span>
            <input
              type="date"
              value={values["revisit_date"] ?? ""}
              onChange={(e) => onChange("revisit_date", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">재진시간</span>
            <input
              type="time"
              value={values["revisit_time"] ?? ""}
              onChange={(e) => onChange("revisit_time", e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
