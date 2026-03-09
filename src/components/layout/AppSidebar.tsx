import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  FileSignature,
  ClipboardList,
  Globe,
  FolderKanban,
  CheckSquare,
  Receipt,
  ShoppingCart,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Circle,
  TrendingUp,
  FileText,
  Clock,
  Package,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";

const mainNav = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/deliveries", icon: Package, label: "Deliveries" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/reporting", icon: BarChart3, label: "Reporting" },
];

const workspaceNav = [
  { to: "/clients", icon: Building2, label: "Clients" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/meetings", icon: CalendarDays, label: "Meetings" },
  { to: "/contracts", icon: FileSignature, label: "Contracts" },
  { to: "/time-tracking", icon: Clock, label: "Time Tracking" },
  { to: "/forms", icon: ClipboardList, label: "Forms" },
  { to: "/client-portal", icon: Globe, label: "Client Portal" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
];

const settingsNav = [
  { to: "/templates", icon: Layers, label: "Templates" },
  { to: "/services", icon: Layers, label: "Services" },
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

const statusDot: Record<string, string> = {
  active: "text-green-500",
  setup: "text-muted-foreground",
  paused: "text-amber-500",
  completed: "text-primary",
};

function RecentProjects({ collapsed }: { collapsed: boolean }) {
  const { data: projects } = useProjects();
  if (collapsed || !projects?.length) return null;

  // Show up to 5 recently active projects (active first, then by updated_at)
  const recent = [...(projects || [])]
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    })
    .slice(0, 5);

  return (
    <div className="mt-1 space-y-0.5">
      {recent.map((p) => (
        <NavLink
          key={p.id}
          to={`/projects/${p.id}`}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all duration-normal",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )
          }
        >
          <Circle className={cn("h-2 w-2 fill-current", statusDot[p.status] || "text-muted-foreground")} />
          <span className="truncate">{p.name}</span>
        </NavLink>
      ))}
    </div>
  );
}

export function AppSidebar({ onOpenAI }: { onOpenAI?: () => void }) {
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
          <div key={item.to}>
            <NavItem item={item} collapsed={collapsed} />
            {item.to === "/projects" && <RecentProjects collapsed={collapsed} />}
          </div>
        ))}

        {/* Workspace Section */}
        {!collapsed && (
          <p className="px-3 pt-6 pb-2 text-overline text-sidebar-foreground/40">
            Clients & Scheduling
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

      {/* AI Assistant toggle */}
      {onOpenAI && (
        <button
          onClick={onOpenAI}
          className="flex items-center justify-center gap-2 mx-3 mb-2 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-normal text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          {!collapsed && <span>AI Assistant</span>}
        </button>
      )}

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
