import { config } from "@/config/config";
import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  const url = config.SUPABASE_URL;
  const anonKey = config.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase Environment Variables");
  }

  return createClient(url, anonKey);
}
