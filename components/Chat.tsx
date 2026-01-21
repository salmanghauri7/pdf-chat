"use client";

import { useState, useRef, useEffect } from "react";
import { Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  isDocumentUploaded: boolean;
  fileId: string | null;
}

export default function Chat({ isDocumentUploaded, fileId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Clear messages when fileId changes (new document uploaded)
  useEffect(() => {
    setMessages([]);
  }, [fileId]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isDocumentUploaded || !fileId) {
      toast.warning("No document uploaded", {
        description: "Please upload a PDF first to start chatting.",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");

    const newUserMessage: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const { data } = await axios.post("/api/message", {
        message: userMessage,
        fileId,
      });

      if (!data.answer) {
        throw new Error("No answer received from the server");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      // Remove the user message if the request failed
      setMessages((prev) => prev.slice(0, -1));

      let errorMessage = "An unexpected error occurred";
      let errorDescription = "Please try again later";

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          error?: string;
          details?: string;
        }>;

        if (axiosError.response) {
          // Server responded with error status
          errorMessage =
            axiosError.response.data?.error || "Failed to get response";
          errorDescription =
            axiosError.response.data?.details ||
            `Status: ${axiosError.response.status}`;

          // Special handling for rate limits
          if (axiosError.response.status === 429) {
            errorMessage = "⏱️ Rate limit reached";
            errorDescription = "Please wait a moment before trying again";
          }
        } else if (axiosError.request) {
          // Request made but no response received
          errorMessage = "No response from server";
          errorDescription = "Please check your internet connection";
        } else {
          // Error in request setup
          errorMessage = "Request failed";
          errorDescription = axiosError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDescription = "Something went wrong";
      }

      toast.error(errorMessage, {
        description: errorDescription,
        action: {
          label: "Retry",
          onClick: () => {
            setInput(userMessage);
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <p className="text-center">
              {isDocumentUploaded
                ? "Start asking questions about your document"
                : "Upload a document and start asking questions"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        {!isDocumentUploaded && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-3 px-1">
            <AlertCircle className="w-4 h-4" />
            <span>Upload a document to start chatting</span>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isDocumentUploaded
                ? "Ask a question about your document..."
                : "Upload a document first..."
            }
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
            disabled={!isDocumentUploaded || isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isDocumentUploaded || isLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
