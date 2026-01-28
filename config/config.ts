export const config = {
  // Use non-NEXT_PUBLIC_ version for server-side API routes
  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
};
