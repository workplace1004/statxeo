const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;

function assertEnv(value: string | undefined, key: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: assertEnv(supabaseUrl, "EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: assertEnv(supabaseAnonKey, "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl: siteUrl?.trim() || "http://localhost:3000",
};
