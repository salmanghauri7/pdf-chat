import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { inngest } from "./client";
import { config } from "@/config/config";
import { createServerClient } from "@/utils/supabase/server";

export const generateSummaryPdfStoreInDatabase = inngest.createFunction(
  {
    id: "generate-summary-pdf",
    retries: 0, // Disable retries to prevent multiple executions
  },
  { event: "pdf.uploaded" },
  async ({ event, step }) => {
    const { fileId, fullText } = event.data;

    // File record already exists with status='processing' (created in API route)
    // We only need to generate summary and UPDATE the record

    const summary = await step.run("call-gemini-for-summary", async () => {
      try {
        const model = new ChatGoogleGenerativeAI({
          apiKey: config.GEMINI_API_KEY,
          model: "gemini-2.5-flash-lite",
        });

        // Truncate fullText if too long (max ~30k chars for safety)
        const truncatedText =
          fullText.length > 30000
            ? fullText.substring(0, 30000) +
              "\n\n[Text truncated for summary...]"
            : fullText;

        const res = await model.invoke([
          [
            "system",
            "Summarize this research document in 3 concise paragraphs.",
          ],
          ["user", truncatedText],
        ]);

        return res.content;
      } catch (error) {
        console.error("Error generating summary:", error);
        throw error;
      }
    });

    await step.run("update-supabase", async () => {
      try {
        const client = createServerClient();

        const { data, error } = await client
          .from("files")
          .update({
            summary: summary,
            status: "completed",
          })
          .eq("id", fileId)
          .select();

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }

        console.log(
          "✅ Successfully updated file record with summary:",
          fileId,
        );
        return data;
      } catch (error) {
        console.error("Error updating Supabase:", error);
        throw error;
      }
    });

    return { success: true, fileId };
  },
);
