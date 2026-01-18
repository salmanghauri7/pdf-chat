"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatProps {
  isDocumentUploaded: boolean;
}

export default function Chat({ isDocumentUploaded }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isDocumentUploaded) {
      toast.warning("No document uploaded", {
        description: "Please upload a PDF first to start chatting.",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // Simulate assistant response
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "This is a simulated response. Connect your backend to enable real responses.",
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response", {
        description: "Please try again.",
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
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
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
