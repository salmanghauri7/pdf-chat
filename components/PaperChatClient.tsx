"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import Chat from "./Chat";

export default function PaperChatClient() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUploaded = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemoved = () => {
    setUploadedFile(null);
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
      <Chat isDocumentUploaded={!!uploadedFile} />
    </>
  );
}
