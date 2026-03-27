import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireRole } from "@/components/auth/RequireRole";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { BrandSpinner } from "@/components/layout/RouteLoadingFallback";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { AIContext, useAIContextProvider } from "@/hooks/useAIContext";

// Direct imports — no lazy loading
import { CreateTaskDialog } from "@/components/dialogs/CreateTaskDialog";
import { CreateClientDialog } from "@/components/dialogs/CreateClientDialog";
import { CreateContactDialog } from "@/components/dialogs/CreateContactDialog";
import { CreateProjectDialog } from "@/components/dialogs/CreateProjectDialog";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { CreateInvoiceDialog } from "@/components/dialogs/CreateInvoiceDialog";
import { CreateProjectFromPlanDialog } from "@/components/dialogs/CreateProjectFromPlanDialog";

import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Contacts from "@/pages/Contacts";
import Meetings from "@/pages/Meetings";
import Contracts from "@/pages/Contracts";
import Deliveries from "@/pages/Deliveries";
import Forms from "@/pages/Forms";
import FormDetail from "@/pages/FormDetail";
import FormBuilder from "@/pages/FormBuilder";
import PublicForm from "@/pages/PublicForm";
import PortalView from "@/pages/PortalView";
import ClientPortal from "@/pages/ClientPortal";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Tasks from "@/pages/Tasks";
import TimeTracking from "@/pages/TimeTracking";
import Resourcing from "@/pages/Resourcing";
import Timesheets from "@/pages/Timesheets";
import Invoices from "@/pages/Invoices";
import Scheduling from "@/pages/Scheduling";
import PurchaseOrders from "@/pages/PurchaseOrders";
import RateCards from "@/pages/RateCards";
import Services from "@/pages/Services";
import Templates from "@/pages/Templates";
import Auth from "@/pages/Auth";
import Reporting from "@/pages/Reporting";
import Portfolio from "@/pages/Portfolio";
import DailyBrief from "@/pages/DailyBrief";
import Automations from "@/pages/Automations";
import Settings from "@/pages/Settings";
import AIAssistant from "@/pages/AIAssistant";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface DialogContextType {
  openCreateTask: () => void;
  openCreateClient: () => void;
  openCreateContact: () => void;
  openCreateProject: () => void;
  openCreateSession: () => void;
  openCreateInvoice: () => void;
  openCreateProjectFromPlan: () => void;
}

export const DialogContext = createContext<DialogContextType>({
  openCreateTask: () => {},
  openCreateClient: () => {},
  openCreateContact: () => {},
  openCreateProject: () => {},
  openCreateSession: () => {},
  openCreateInvoice: () => {},
  openCreateProjectFromPlan: () => {},
});

export const useDialogs = () => useContext(DialogContext);

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return <BrandSpinner />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout />;
}

function KeyboardShortcuts({ dialogs }: { dialogs: DialogContextType }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate("/");
      }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (location.pathname === "/tasks") dialogs.openCreateTask();
        else if (location.pathname === "/clients") dialogs.openCreateClient();
        else if (location.pathname === "/contacts") dialogs.openCreateContact();
        else if (location.pathname === "/projects") dialogs.openCreateProject();
        else if (location.pathname === "/invoices") dialogs.openCreateInvoice();
        else if (location.pathname === "/meetings") dialogs.openCreateSession();
        else dialogs.openCreateProject();
      }
      if ((e.key === "f" || e.key === "/") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[placeholder*="Search"]');
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, location, dialogs]);

  return null;
}

function AppShell() {
  const [taskOpen, setTaskOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const aiContextProvider = useAIContextProvider();

  const dialogs: DialogContextType = {
    openCreateTask: useCallback(() => setTaskOpen(true), []),
    openCreateClient: useCallback(() => setClientOpen(true), []),
    openCreateContact: useCallback(() => setContactOpen(true), []),
    openCreateProject: useCallback(() => setProjectOpen(true), []),
    openCreateSession: useCallback(() => setSessionOpen(true), []),
    openCreateInvoice: useCallback(() => setInvoiceOpen(true), []),
    openCreateProjectFromPlan: useCallback(() => setPlanOpen(true), []),
  };

  return (
    <AIContext.Provider value={aiContextProvider}>
    <DialogContext.Provider value={dialogs}>
      <KeyboardShortcuts dialogs={dialogs} />
      <CommandPalette
        onCreateTask={dialogs.openCreateTask}
        onCreateClient={dialogs.openCreateClient}
        onCreateContact={dialogs.openCreateContact}
        onCreateProject={dialogs.openCreateProject}
        onCreateInvoice={dialogs.openCreateInvoice}
      />
      {taskOpen && <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />}
      {clientOpen && <CreateClientDialog open={clientOpen} onOpenChange={setClientOpen} />}
      {contactOpen && <CreateContactDialog open={contactOpen} onOpenChange={setContactOpen} />}
      {projectOpen && <CreateProjectDialog open={projectOpen} onOpenChange={setProjectOpen} />}
      {sessionOpen && <CreateSessionDialog open={sessionOpen} onOpenChange={setSessionOpen} />}
      {invoiceOpen && <CreateInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />}
      {planOpen && <CreateProjectFromPlanDialog open={planOpen} onOpenChange={setPlanOpen} />}

      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/form/:formId" element={<PublicForm />} />
        <Route path="/portal/:orgId" element={<PortalView />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/daily" element={<DailyBrief />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/resourcing" element={<Resourcing />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/forms/:id" element={<FormDetail />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/rate-cards" element={<RequireRole roles={['admin', 'user']}><RateCards /></RequireRole>} />
          <Route path="/services" element={<RequireRole roles={['admin', 'user']}><Services /></RequireRole>} />
          <Route path="/templates" element={<RequireRole roles={['admin', 'user']}><Templates /></RequireRole>} />
          <Route path="/automations" element={<RequireRole roles={['admin', 'user']}><Automations /></RequireRole>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai" element={<AIAssistant />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </DialogContext.Provider>
    </AIContext.Provider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

export default App;
