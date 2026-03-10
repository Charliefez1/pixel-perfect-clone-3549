import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAIContext } from "@/hooks/useAIContext";

export function AppLayout() {
  const [aiOpen, setAiOpen] = useState(false);
  const isMobile = useIsMobile();
  const { getContext } = useAIContext();

  const aiContext = useMemo(() => {
    if (!aiOpen) return undefined;
    const ctx = getContext();
    return ctx ? ctx : undefined;
  }, [aiOpen, getContext]);

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <AppSidebar onOpenAI={() => setAiOpen(true)} />}
      <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "pb-14" : ""}`}>
        <Outlet />
      </main>
      {isMobile && <MobileNav onOpenAI={() => setAiOpen(true)} />}
      <AIChatPanel open={aiOpen} onOpenChange={setAiOpen} context={aiContext} />
    </div>
  );
}
