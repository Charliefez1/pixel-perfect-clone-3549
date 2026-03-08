import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/activity", icon: Bell, label: "Notifications" },
  { to: "/contacts", icon: Users, label: "Contacts" },
  { to: "/organisations", icon: Building2, label: "Organisations" },
];

const workspaceNav = [
  { to: "/pipeline", icon: GitBranch, label: "Deals" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/tasks", icon: CheckSquare, label: "Tasks" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function NavItem({ item, collapsed }: { item: typeof mainNav[0]; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-primary"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
          N
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            NDG Hub
          </span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <button className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md bg-sidebar-accent/50 text-sidebar-foreground/50 text-sm hover:bg-sidebar-accent transition-colors">
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}

        {/* Workspace Section */}
        {!collapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Workspace
          </p>
        )}
        {collapsed && <div className="h-3" />}
        {workspaceNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
