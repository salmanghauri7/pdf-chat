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

    const documentWorkflowKeywords = [
      // Summarization
      "summarize this pdf",
      "summarize this document",
      "summarize this file",
      "summarize this paper",
      "give me an overview of the document",
      "tl;dr of this pdf",
      "what are the key takeaways from this paper",
      "summarize the main points of the text",
      "briefly explain this attachment",
      "explain this pdf",

      // Structural Analysis
      "break down this report",
      "outline the contents of this document",
      "analyze the findings in this file",
      "extract the methodology from this paper",
      "what is the conclusion of this document",

      // Extraction
      "find the data points in this pdf",
      "list the references in this document",
      "what are the core arguments in this file",
      "identify the main themes of this text",
      "who are the authors of this document",
    ];

    const client = createClient();

    // Check if message contains any document workflow keywords
    const lowerMessage = message.toLowerCase();
    const containsKeyword = documentWorkflowKeywords.some((keyword) =>
      lowerMessage.includes(keyword.toLowerCase()),
    );

    // If keyword detected, return summary from files table
    if (containsKeyword) {
      const { data: fileData, error: fileError } = await client
        .from("files")
        .select("summary")
        .eq("id", fileId)
        .single();

      if (fileError) {
        return NextResponse.json(
          { error: "Failed to fetch file summary", details: fileError.message },
          { status: 500 },
        );
      }

      if (!fileData || !fileData.summary) {
        return NextResponse.json(
          { error: "Summary not available for this file" },
          { status: 404 },
        );
      }

      return NextResponse.json({ answer: fileData.summary });
    }

    
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
