import PaperChatClient from "@/components/PaperChatClient";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Paper Chat
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Upload a PDF and chat with your document
            </p>
          </div>
        </div>

        {/* Client Components */}
        <PaperChatClient />
      </main>
    </div>
  );
}
