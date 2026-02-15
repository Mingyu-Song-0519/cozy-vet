type PatientSearchProps = {
  q: string;
  month: string;
};

export function PatientSearch({ q, month }: PatientSearchProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <form className="grid gap-2 md:grid-cols-[1fr_180px_auto]" method="get">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">환자 검색</span>
          <input
            name="q"
            defaultValue={q}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            placeholder="차트번호, 보호자명, 동물 이름"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">월별 필터</span>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
          >
            검색
          </button>
          <a
            href="/patients"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 text-center min-w-[60px]"
          >
            초기화
          </a>
        </div>
      </form>
    </section>
  );
}
