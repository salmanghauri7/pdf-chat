import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config/config";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createClient } from "@/utils/supabase/client";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { inngest } from "@/inngest/client";

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
    const fileSizeInBytes = file.size;

    // Optional: Convert to Megabytes for logging or metadata
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

    const docsWithMetadata = docs.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        file_id: fileId,
      },
    }));

    // supabase client here
    const client = createClient();

    // 1. INSERT file record FIRST with status='processing'
    const { error: fileInsertError } = await client.from("files").insert({
      id: fileId,
      file_name: file.name,
      file_size: fileSizeInMB,
      summary: null,
      status: "processing",
    });

    if (fileInsertError) {
      console.error("Failed to create file record:", fileInsertError);
      throw fileInsertError;
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.GEMINI_API_KEY,
      model: "gemini-embedding-001",
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    }); 

    const vectorStore = await SupabaseVectorStore.fromDocuments(
      docsWithMetadata,
      embeddings,
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    // Update all inserted documents with the file_id column
    const documentIds = docsWithMetadata.map(() => crypto.randomUUID());

    // Get all documents that were just inserted (they have file_id in metadata)
    const { data: insertedDocs, error: fetchError } = await client
      .from("documents")
      .select("id")
      .contains("metadata", { file_id: fileId });

    if (!fetchError && insertedDocs) {
      // Update the file_id column for all these documents
      await client
        .from("documents")
        .update({ file_id: fileId })
        .in(
          "id",
          insertedDocs.map((doc) => doc.id),
        );
    }

    // 2. AFTER file record exists, trigger Inngest to generate summary
    await inngest.send({
      name: "pdf.uploaded",
      data: {
        fileId: fileId,
        fileSize: fileSizeInMB,
        fileName: file.name,
        fullText: rawDocs.map((doc) => doc.pageContent).join("\n\n"),
      },
    });

    return NextResponse.json(
      {
        message: "Ingestion  complete",
        chunks: docs.length,
        fileId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
