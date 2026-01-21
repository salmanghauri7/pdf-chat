import { inngest } from "@/inngest/client";
import { generateSummaryPdfStoreInDatabase } from "@/inngest/function";
import { serve } from "inngest/next";
import { config } from "@/config/config";

export const { POST, PUT, GET } = serve({
  client: inngest,
  functions: [generateSummaryPdfStoreInDatabase],
  signingKey: config.INNGEST_SIGNING_KEY,
});
