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
  FolderKanban,
  CheckSquare,
  Receipt,
  CalendarDays,
  Plus,
  Search,
} from "lucide-react";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useContacts } from "@/hooks/useContacts";
import { useProjects } from "@/hooks/useProjects";

const pages = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Deliveries", to: "/deliveries", icon: FolderKanban },
  { label: "Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Invoices", to: "/invoices", icon: Receipt },
  { label: "Clients", to: "/clients", icon: Building2 },
  { label: "Contacts", to: "/contacts", icon: Users },
  { label: "Sessions", to: "/meetings", icon: CalendarDays },
];

interface CommandPaletteProps {
  onCreateTask?: () => void;
  onCreateClient?: () => void;
  onCreateContact?: () => void;
  onCreateProject?: () => void;
  onCreateInvoice?: () => void;
}

export function CommandPalette({ onCreateTask, onCreateClient, onCreateContact, onCreateProject, onCreateInvoice }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: orgs } = useOrganisations();
  const { data: contacts } = useContacts();
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
          <CommandItem onSelect={() => action(onCreateProject)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </CommandItem>
          <CommandItem onSelect={() => action(onCreateTask)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </CommandItem>
          <CommandItem onSelect={() => action(onCreateInvoice)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
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
                <CommandItem key={o.id} onSelect={() => go(`/clients/${o.id}`)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {o.name}
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
                <CommandItem key={p.id} onSelect={() => go(`/projects/${p.id}`)}>
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
