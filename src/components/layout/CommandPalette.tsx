import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  FolderKanban,
  CheckSquare,
  Receipt,
  CalendarDays,
  Plus,
  Search,
} from "lucide-react";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useContacts } from "@/hooks/useContacts";
import { useDeals } from "@/hooks/useDeals";
import { useProjects } from "@/hooks/useProjects";

const pages = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Clients", to: "/clients", icon: Building2 },
  { label: "Contacts", to: "/contacts", icon: Users },
  { label: "Deals", to: "/deals", icon: Briefcase },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Sessions", to: "/meetings", icon: CalendarDays },
  { label: "Invoices", to: "/invoices", icon: Receipt },
];

interface CommandPaletteProps {
  onCreateDeal?: () => void;
  onCreateTask?: () => void;
  onCreateClient?: () => void;
  onCreateContact?: () => void;
}

export function CommandPalette({ onCreateDeal, onCreateTask, onCreateClient, onCreateContact }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: orgs } = useOrganisations();
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const { data: projects } = useProjects();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = useCallback((to: string) => {
    navigate(to);
    setOpen(false);
  }, [navigate]);

  const action = useCallback((fn?: () => void) => {
    setOpen(false);
    fn?.();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => action(onCreateDeal)}>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </CommandItem>
          <CommandItem onSelect={() => action(onCreateTask)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </CommandItem>
          <CommandItem onSelect={() => action(onCreateClient)}>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </CommandItem>
          <CommandItem onSelect={() => action(onCreateContact)}>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {orgs && orgs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Clients">
              {orgs.slice(0, 8).map((o) => (
                <CommandItem key={o.id} onSelect={() => go("/clients")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {deals && deals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Deals">
              {deals.slice(0, 8).map((d) => (
                <CommandItem key={d.id} onSelect={() => go("/deals")}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  {d.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects && projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 8).map((p) => (
                <CommandItem key={p.id} onSelect={() => go("/projects")}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {contacts && contacts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contacts">
              {contacts.slice(0, 8).map((c) => (
                <CommandItem key={c.id} onSelect={() => go("/contacts")}>
                  <Users className="mr-2 h-4 w-4" />
                  {c.first_name} {c.last_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
