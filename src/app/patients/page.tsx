import { ExcelUpload } from "@/components/patients/excel-upload";
import { PatientForm } from "@/components/patients/patient-form";
import { PatientSearch } from "@/components/patients/patient-search";
import { PatientTable } from "@/components/patients/patient-table";

type PatientsPageProps = {
  searchParams: Promise<{
    q?: string;
    month?: string;
  }>;
};

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const month = params.month?.trim() ?? "";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold">환자 관리</h1>
        <p className="mt-1 text-sm text-slate-600">
          환자 조회, Excel 업로드, 중복 처리, CRUD를 관리합니다.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <PatientSearch q={q} month={month} />
        <ExcelUpload />
      </div>
      <PatientForm />
      <PatientTable q={q} month={month} />
    </div>
  );
}
