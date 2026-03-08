import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useState } from "react";

export function AppLayout() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar onOpenAI={() => setAiOpen(true)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <AIChatPanel open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
