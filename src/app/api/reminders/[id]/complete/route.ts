import { NextResponse } from "next/server";

export const runtime = "edge";
import { completeReminder } from "@/actions/reminders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = await completeReminder(id);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: `리마인더 완료 처리 실패: ${result.message}`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    result,
  });
}
