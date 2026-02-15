import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetch } from "undici";

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
      global: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetch: fetch as any,
      },
    },
  );
}
