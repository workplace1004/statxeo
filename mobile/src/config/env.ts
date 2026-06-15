const siteUrl = process.env.EXPO_PUBLIC_SITE_URL;

function assertEnv(value: string | undefined, key: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  siteUrl: siteUrl?.trim() || "http://localhost:3000",
};
