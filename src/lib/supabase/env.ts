export function hasSupabaseEnv(inputUrl?: string, inputKey?: string) {
  return Boolean(
    (inputUrl || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (inputKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
