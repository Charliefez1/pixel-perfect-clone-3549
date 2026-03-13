import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <AppSidebar />}
      <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "pb-14" : ""}`}>
        <Outlet />
      </main>
      {isMobile && <MobileNav />}
    </div>
  );
}
