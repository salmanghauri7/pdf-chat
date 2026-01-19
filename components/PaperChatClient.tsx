"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import Chat from "./Chat";

export default function PaperChatClient() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  const handleFileUploaded = (file: File, id: string) => {
    setUploadedFile(file);
    setFileId(id);
  };

  const handleFileRemoved = () => {
    setUploadedFile(null);
    setFileId(null);
  };

  return (
    <>
      {/* File Upload Zone */}
      <FileUpload
        onFileUploaded={handleFileUploaded}
        onFileRemoved={handleFileRemoved}
        uploadedFile={uploadedFile}
      />

      {/* Chat Interface */}
      <Chat isDocumentUploaded={!!uploadedFile} fileId={fileId} />
    </>
  );
}
