import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 필요합니다.`);
  }

  return value;
}

export function getSupabaseServerClient() {
  return createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: false,
      },
      // Edge Runtime 환경에서는 global fetch가 기본 사용되므로 명시적 설정 불필요
      // 필요한 경우 global: { fetch: fetch } 사용 가능
    },
  );
}
