import { config } from "@/config/config";
import { createClient } from "@/utils/supabase/client";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { NextRequest, NextResponse } from "next/server";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(req: NextRequest) {
  try {
    const { message, fileId } = await req.json();

    if (!message || !fileId) {
      return NextResponse.json(
        { error: "Message and fileId are required" },
        { status: 400 },
      );
    }

    const client = createClient();

    // Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.GEMINI_API_KEY,
      modelName: "text-embedding-004",
    });

    // Initialize vector store with fileId filter
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
      filter: { fileId },
    });

    // Perform semantic search
    const retrievedDocs = await vectorStore.similaritySearch(message, 4);
    const context = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");

    // Initialize model
    const model = new ChatGoogleGenerativeAI({
      apiKey: config.GEMINI_API_KEY,
      model: "gemini-2.5-flash-lite",
      temperature: 0.3,
    });

    // Create simple prompt
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful research assistant. Answer the user's question based ONLY on the provided context. If the answer is not in the context, say so.\n\nContext:\n{context}",
      ],
      ["user", "{question}"],
    ]);

    // Create chain and invoke
    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const response = await chain.invoke({ context, question: message });

    return NextResponse.json({ answer: response });
  } catch (error) {
    console.error("Error in message API:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Rate limit error from Gemini API
      if (error.message.includes("429") || error.message.includes("quota")) {
        return NextResponse.json(
          {
            error: "API rate limit exceeded",
            details:
              "Please wait a moment and try again. Consider upgrading your API plan for higher limits.",
          },
          { status: 429 },
        );
      }

      // Vector search error
      if (error.message.includes("PGRST")) {
        return NextResponse.json(
          {
            error: "Database error",
            details: "Failed to search documents. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}
