import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bell,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  FileText,
  FileSignature,
  ClipboardList,
  Globe,
  FolderKanban,
  CheckSquare,
  Clock,
  UserCog,
  Timer,
  Receipt,
  CalendarClock,
  ShoppingCart,
  CreditCard,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/clients", icon: Building2, label: "Clients" },
  { to: "/contacts", icon: Users, label: "Contacts" },
];

const workspaceNav = [
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/deliveries", icon: FolderKanban, label: "Deliveries" },
  { to: "/meetings", icon: CalendarDays, label: "Sessions" },
  { to: "/proposals", icon: FileText, label: "Proposals" },
  { to: "/contracts", icon: FileSignature, label: "Contracts" },
  { to: "/forms", icon: ClipboardList, label: "Forms" },
  { to: "/client-portal", icon: Globe, label: "Client Portal" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { to: "/resourcing", icon: UserCog, label: "Resourcing" },
  { to: "/timesheets", icon: Timer, label: "Timesheets" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/scheduling", icon: CalendarClock, label: "Scheduling" },
  { to: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/rate-cards", icon: CreditCard, label: "Rate Cards" },
  { to: "/services", icon: Layers, label: "Services" },
];

const settingsNav = [
  { to: "/templates", icon: Layers, label: "Templates" },
];

function NavItem({ item, collapsed }: { item: typeof mainNav[0]; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-normal",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )
      }
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-slow h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          N
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight">
            NDG Hub
          </span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-sidebar-accent/50 text-sidebar-foreground/50 text-sm hover:bg-sidebar-accent transition-all duration-normal">
            <Search className="h-4 w-4" strokeWidth={2} />
            <span>Search</span>
            <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* Workspace Section */}
        {!collapsed && (
          <p className="px-3 pt-6 pb-2 text-overline text-sidebar-foreground/40">
            Workspace
          </p>
        )}
        {collapsed && <div className="h-4" />}
        {workspaceNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* Settings Section */}
        {!collapsed && (
          <p className="px-3 pt-6 pb-2 text-overline text-sidebar-foreground/40">
            Settings
          </p>
        )}
        {collapsed && <div className="h-4" />}
        {settingsNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-all duration-normal"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
