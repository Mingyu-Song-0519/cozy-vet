import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type LookupItem = {
  id: string;
  chart_number: string;
  owner_name: string;
  pet_name: string;
  visit_date: string;
  payment_amount: number | null;
  revisit_date: string | null;
};

const fallbackItems: LookupItem[] = [
  {
    id: "p1",
    chart_number: "12706",
    owner_name: "김OO",
    pet_name: "겨울이",
    visit_date: "2026-02-13",
    payment_amount: 450000,
    revisit_date: "2026-02-15T14:00:00Z",
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const id = url.searchParams.get("id")?.trim() ?? "";

  if (!hasSupabaseEnv()) {
    const items = id
      ? fallbackItems.filter((item) => item.id === id)
      : q
      ? fallbackItems.filter((item) => {
          const keyword = q.toLowerCase();
          return (
            item.chart_number.toLowerCase().includes(keyword) ||
            item.owner_name.toLowerCase().includes(keyword) ||
            item.pet_name.toLowerCase().includes(keyword)
          );
        })
      : fallbackItems;

    return NextResponse.json({
      ok: true,
      db_connected: false,
      items,
    });
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("patients")
    .select(
      "id, chart_number, owner_name, pet_name, visit_date, payment_amount, revisit_date",
    )
    .order("visit_date", { ascending: false })
    .limit(30);

  if (id) {
    query = query.eq("id", id);
  } else if (q) {
    const escaped = q.replace(/,/g, " ");
    query = query.or(
      `chart_number.ilike.%${escaped}%,owner_name.ilike.%${escaped}%,pet_name.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, message: `환자 조회 실패: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    db_connected: true,
    items: (data ?? []) as LookupItem[],
  });
}
