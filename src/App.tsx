import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
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
import Deals from "@/pages/Deals";
import Proposals from "@/pages/Proposals";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CreateTaskDialog } from "@/components/dialogs/CreateTaskDialog";
import { CreateClientDialog } from "@/components/dialogs/CreateClientDialog";
import { CreateContactDialog } from "@/components/dialogs/CreateContactDialog";
import { CreateProjectDialog } from "@/components/dialogs/CreateProjectDialog";
import { CreateSessionDialog } from "@/components/dialogs/CreateSessionDialog";
import { CreateInvoiceDialog } from "@/components/dialogs/CreateInvoiceDialog";
import { CreateProjectFromPlanDialog } from "@/components/dialogs/CreateProjectFromPlanDialog";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

const queryClient = new QueryClient();

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse">
          N
        </div>
      </div>
    );
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
      // Don't trigger in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "d" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate("/");
      }
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        // Context-aware new item
        if (location.pathname === "/tasks") dialogs.openCreateTask();
        else if (location.pathname === "/clients") dialogs.openCreateClient();
        else if (location.pathname === "/contacts") dialogs.openCreateContact();
        else if (location.pathname === "/projects") dialogs.openCreateProject();
        else if (location.pathname === "/invoices") dialogs.openCreateInvoice();
        else if (location.pathname === "/meetings") dialogs.openCreateSession();
        else dialogs.openCreateProject(); // default
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
    <DialogContext.Provider value={dialogs}>
      <KeyboardShortcuts dialogs={dialogs} />
      <CommandPalette
        onCreateTask={dialogs.openCreateTask}
        onCreateClient={dialogs.openCreateClient}
        onCreateContact={dialogs.openCreateContact}
        onCreateProject={dialogs.openCreateProject}
        onCreateInvoice={dialogs.openCreateInvoice}
      />
      <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <CreateClientDialog open={clientOpen} onOpenChange={setClientOpen} />
      <CreateContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <CreateProjectDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <CreateSessionDialog open={sessionOpen} onOpenChange={setSessionOpen} />
      <CreateInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      <CreateProjectFromPlanDialog open={planOpen} onOpenChange={setPlanOpen} />
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        {/* Public routes — no auth required */}
        <Route path="/form/:formId" element={<PublicForm />} />
        <Route path="/portal/:orgId" element={<PortalView />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/deliveries" element={<Deliveries />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/forms/:id" element={<FormDetail />} />
          <Route path="/forms/:id/edit" element={<FormBuilder />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/resourcing" element={<Resourcing />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/rate-cards" element={<RateCards />} />
          <Route path="/services" element={<Services />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/reporting" element={<Reporting />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DialogContext.Provider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TooltipProvider>
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
