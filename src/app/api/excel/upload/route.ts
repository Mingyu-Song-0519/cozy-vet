import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message:
      "Excel 원본 파일 업로드 엔드포인트입니다. 실제 파싱은 클라이언트에서 수행합니다.",
  });
}
