import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 누락되었습니다.");
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
      // Edge Runtime 환경에서는 global fetch가 기본 사용되므로 명시적 설정 불필요
      // 필요한 경우 global: { fetch: fetch } 사용 가능
    },
  );
}
