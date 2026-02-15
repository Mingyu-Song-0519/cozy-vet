import { NextResponse } from "next/server";
import { skipReminder } from "@/actions/reminders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await skipReminder(id);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `리마인더 건너뛰기 실패: ${result.message}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    result,
  });
}
