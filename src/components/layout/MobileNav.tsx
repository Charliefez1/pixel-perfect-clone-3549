import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, CheckSquare, Menu, X, Receipt, Users, FileSignature, ClipboardList, Globe, Layers, ShoppingCart, BarChart3, CalendarDays, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const primaryTabs = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
];

const allNav = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/deliveries", icon: FolderKanban, label: "Deliveries" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/reporting", icon: BarChart3, label: "Reporting" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/meetings", icon: CalendarDays, label: "Sessions" },
  { to: "/contracts", icon: FileSignature, label: "Contracts" },
  { to: "/forms", icon: ClipboardList, label: "Forms" },
  { to: "/client-portal", icon: Globe, label: "Client Portal" },
  { to: "/templates", icon: Layers, label: "Templates" },
  { to: "/services", icon: Layers, label: "Services" },
];

interface Props {
  onOpenAI?: () => void;
}

export function MobileNav({ onOpenAI }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex items-center justify-around h-14 md:hidden safe-area-bottom">
        {primaryTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
          More
        </button>
      </nav>

      {/* Full nav sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                N
              </div>
              <SheetTitle className="text-base font-bold">NDG Hub</SheetTitle>
            </div>
          </SheetHeader>
          <div className="py-2 px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {allNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </NavLink>
            ))}
          </div>
          {onOpenAI && (
            <div className="p-3 border-t border-border">
              <button
                onClick={() => { onOpenAI(); setOpen(false); }}
                className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
