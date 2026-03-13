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
  Sun,
  Briefcase,
  Zap,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";

const mainNav = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/daily", icon: Sun, label: "Daily Brief" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/portfolio", icon: Briefcase, label: "Portfolio" },
  { to: "/deliveries", icon: Package, label: "Deliveries" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/invoices", icon: Receipt, label: "Invoices" },
  { to: "/purchase-orders", icon: ShoppingCart, label: "Purchase Orders" },
  { to: "/reporting", icon: BarChart3, label: "Reporting" },
  { to: "/automations", icon: Zap, label: "Automations" },
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

const adminNav = [
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
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
          isActive
            ? "bg-accent-muted border-l-2 border-accent text-foreground font-medium"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted"
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
              "flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs transition-all duration-150",
              isActive
                ? "bg-accent-muted text-foreground font-medium"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-muted"
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

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-slow h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand + User */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          {profile?.display_name?.charAt(0)?.toUpperCase() || "N"}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">
              {profile?.display_name || "NDG Hub"}
            </span>
            <span className="text-[11px] text-sidebar-foreground/50 truncate">
              {profile?.email || ""}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4">
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted text-sidebar-foreground/50 text-sm hover:bg-sidebar-accent transition-all duration-150">
            <Search className="h-4 w-4" strokeWidth={2} />
            <span>Search</span>
            <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <span className="text-overline text-sidebar-foreground/50 px-3 mb-2 block">MENU</span>
        )}
        {mainNav.map((item) => (
          <div key={item.to}>
            <NavItem item={item} collapsed={collapsed} />
            {item.to === "/projects" && <RecentProjects collapsed={collapsed} />}
          </div>
        ))}

        {/* Workspace Section */}
        {!collapsed && (
          <span className="text-overline text-sidebar-foreground/50 px-3 pt-5 pb-1 block">WORKSPACE</span>
        )}
        {collapsed && <div className="h-4" />}
        {workspaceNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* Admin Section */}
        {!collapsed && (
          <span className="text-overline text-sidebar-foreground/50 px-3 pt-5 pb-1 block">ADMIN</span>
        )}
        {collapsed && <div className="h-4" />}
        {adminNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-2 space-y-1">
        {/* AI Assistant link */}
        <NavItem item={{ to: "/ai", icon: Sparkles, label: "AI Assistant" }} collapsed={collapsed} />

        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
              isActive
                ? "bg-accent-muted border-l-2 border-accent text-foreground font-medium"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-muted"
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-all duration-150"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
