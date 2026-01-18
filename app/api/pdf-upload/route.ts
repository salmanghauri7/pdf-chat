import { NextRequest, NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@/utils/supabase/client";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Initialize the Loader with the File object directly
    // No need to convert to Buffer or ArrayBuffer manually
    const loader = new WebPDFLoader(file);
    const rawDocs = await loader.load();

    // 2. Use the splitters
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments(rawDocs);
    const fileId = crypto.randomUUID();

    const docsWithMetadata = docs.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        fileId: fileId,
      },
    }));

    // supabase client here
    const client = createClient();

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY,
      modelName: "text-embedding-004", // Most efficient for RAG in 2026
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });

    await SupabaseVectorStore.fromDocuments(docsWithMetadata, embeddings, {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });

    return NextResponse.json(
      {
        message: "Ingestion complete",
        chunks: docs.length,
        fileId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ Ingestion Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
