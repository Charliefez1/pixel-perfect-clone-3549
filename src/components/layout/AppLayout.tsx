import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <AppSidebar onOpenAI={() => setAiOpen(true)} />}
      <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "pb-14" : ""}`}>
        <Outlet />
      </main>
      {isMobile && <MobileNav onOpenAI={() => setAiOpen(true)} />}
      <AIChatPanel open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
