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
import { BrandSpinner, PageSkeleton, DashboardSkeleton, SettingsSkeleton } from "@/components/layout/RouteLoadingFallback";
import { useState, useEffect, createContext, useContext, useCallback, lazy, Suspense } from "react";
import { AIContext, useAIContextProvider } from "@/hooks/useAIContext";

// Lazy-loaded dialog components — only loaded when user opens a dialog
const CreateTaskDialog = lazy(() =>
  import("@/components/dialogs/CreateTaskDialog").then(m => ({ default: m.CreateTaskDialog }))
);
const CreateClientDialog = lazy(() =>
  import("@/components/dialogs/CreateClientDialog").then(m => ({ default: m.CreateClientDialog }))
);
const CreateContactDialog = lazy(() =>
  import("@/components/dialogs/CreateContactDialog").then(m => ({ default: m.CreateContactDialog }))
);
const CreateProjectDialog = lazy(() =>
  import("@/components/dialogs/CreateProjectDialog").then(m => ({ default: m.CreateProjectDialog }))
);
const CreateSessionDialog = lazy(() =>
  import("@/components/dialogs/CreateSessionDialog").then(m => ({ default: m.CreateSessionDialog }))
);
const CreateInvoiceDialog = lazy(() =>
  import("@/components/dialogs/CreateInvoiceDialog").then(m => ({ default: m.CreateInvoiceDialog }))
);
const CreateProjectFromPlanDialog = lazy(() =>
  import("@/components/dialogs/CreateProjectFromPlanDialog").then(m => ({ default: m.CreateProjectFromPlanDialog }))
);

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Meetings = lazy(() => import("@/pages/Meetings"));
const Contracts = lazy(() => import("@/pages/Contracts"));
const Deliveries = lazy(() => import("@/pages/Deliveries"));
const Forms = lazy(() => import("@/pages/Forms"));
const FormDetail = lazy(() => import("@/pages/FormDetail"));
const FormBuilder = lazy(() => import("@/pages/FormBuilder"));
const PublicForm = lazy(() => import("@/pages/PublicForm"));
const PortalView = lazy(() => import("@/pages/PortalView"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const Projects = lazy(() => import("@/pages/Projects"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Tasks = lazy(() => import("@/pages/Tasks"));
const TimeTracking = lazy(() => import("@/pages/TimeTracking"));
const Resourcing = lazy(() => import("@/pages/Resourcing"));
const Timesheets = lazy(() => import("@/pages/Timesheets"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Scheduling = lazy(() => import("@/pages/Scheduling"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrders"));
const RateCards = lazy(() => import("@/pages/RateCards"));
const Services = lazy(() => import("@/pages/Services"));
const Templates = lazy(() => import("@/pages/Templates"));
const Auth = lazy(() => import("@/pages/Auth"));
const Reporting = lazy(() => import("@/pages/Reporting"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const DailyBrief = lazy(() => import("@/pages/DailyBrief"));
const Automations = lazy(() => import("@/pages/Automations"));
const Settings = lazy(() => import("@/pages/Settings"));
const AIAssistant = lazy(() => import("@/pages/AIAssistant"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes
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
      {/* Lazy-loaded dialogs — each wrapped in its own Suspense so they load independently */}
      <Suspense fallback={null}>
        {taskOpen && <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {clientOpen && <CreateClientDialog open={clientOpen} onOpenChange={setClientOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {contactOpen && <CreateContactDialog open={contactOpen} onOpenChange={setContactOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {projectOpen && <CreateProjectDialog open={projectOpen} onOpenChange={setProjectOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {sessionOpen && <CreateSessionDialog open={sessionOpen} onOpenChange={setSessionOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {invoiceOpen && <CreateInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />}
      </Suspense>
      <Suspense fallback={null}>
        {planOpen && <CreateProjectFromPlanDialog open={planOpen} onOpenChange={setPlanOpen} />}
      </Suspense>

      <Routes>
        {/* Auth route */}
        <Route path="/auth" element={
          <Suspense fallback={<BrandSpinner />}>
            <AuthRoute />
          </Suspense>
        } />

        {/* Public routes — no auth required */}
        <Route path="/form/:formId" element={
          <Suspense fallback={<BrandSpinner />}>
            <PublicForm />
          </Suspense>
        } />
        <Route path="/portal/:orgId" element={
          <Suspense fallback={<BrandSpinner />}>
            <PortalView />
          </Suspense>
        } />

        <Route element={<ProtectedRoutes />}>
          {/* Dashboard & overview routes */}
          <Route path="/" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<PageSkeleton label="notifications" />}>
              <Notifications />
            </Suspense>
          } />
          <Route path="/daily" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <DailyBrief />
            </Suspense>
          } />
          <Route path="/portfolio" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Portfolio />
            </Suspense>
          } />
          <Route path="/reporting" element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Reporting />
            </Suspense>
          } />

          {/* Client & contact routes */}
          <Route path="/clients" element={
            <Suspense fallback={<PageSkeleton label="clients" />}>
              <Clients />
            </Suspense>
          } />
          <Route path="/clients/:id" element={
            <Suspense fallback={<PageSkeleton label="client details" />}>
              <ClientDetail />
            </Suspense>
          } />
          <Route path="/contacts" element={
            <Suspense fallback={<PageSkeleton label="contacts" />}>
              <Contacts />
            </Suspense>
          } />
          <Route path="/client-portal" element={
            <Suspense fallback={<PageSkeleton label="client portal" />}>
              <ClientPortal />
            </Suspense>
          } />

          {/* Project & task routes */}
          <Route path="/projects" element={
            <Suspense fallback={<PageSkeleton label="projects" />}>
              <Projects />
            </Suspense>
          } />
          <Route path="/projects/:id" element={
            <Suspense fallback={<PageSkeleton label="project details" />}>
              <ProjectDetail />
            </Suspense>
          } />
          <Route path="/tasks" element={
            <Suspense fallback={<PageSkeleton label="tasks" />}>
              <Tasks />
            </Suspense>
          } />
          <Route path="/deliveries" element={
            <Suspense fallback={<PageSkeleton label="deliveries" />}>
              <Deliveries />
            </Suspense>
          } />

          {/* Scheduling & time routes */}
          <Route path="/meetings" element={
            <Suspense fallback={<PageSkeleton label="meetings" />}>
              <Meetings />
            </Suspense>
          } />
          <Route path="/scheduling" element={
            <Suspense fallback={<PageSkeleton label="scheduling" />}>
              <Scheduling />
            </Suspense>
          } />
          <Route path="/time-tracking" element={
            <Suspense fallback={<PageSkeleton label="time tracking" />}>
              <TimeTracking />
            </Suspense>
          } />
          <Route path="/timesheets" element={
            <Suspense fallback={<PageSkeleton label="timesheets" />}>
              <Timesheets />
            </Suspense>
          } />
          <Route path="/resourcing" element={
            <Suspense fallback={<PageSkeleton label="resourcing" />}>
              <Resourcing />
            </Suspense>
          } />

          {/* Finance routes */}
          <Route path="/invoices" element={
            <Suspense fallback={<PageSkeleton label="invoices" />}>
              <Invoices />
            </Suspense>
          } />
          <Route path="/purchase-orders" element={
            <Suspense fallback={<PageSkeleton label="purchase orders" />}>
              <PurchaseOrders />
            </Suspense>
          } />
          <Route path="/contracts" element={
            <Suspense fallback={<PageSkeleton label="contracts" />}>
              <Contracts />
            </Suspense>
          } />

          {/* Forms routes */}
          <Route path="/forms" element={
            <Suspense fallback={<PageSkeleton label="forms" />}>
              <Forms />
            </Suspense>
          } />
          <Route path="/forms/:id" element={
            <Suspense fallback={<PageSkeleton label="form details" />}>
              <FormDetail />
            </Suspense>
          } />
          <Route path="/forms/:id/edit" element={
            <Suspense fallback={<PageSkeleton label="form builder" />}>
              <FormBuilder />
            </Suspense>
          } />

          {/* Admin & settings routes */}
          <Route path="/rate-cards" element={
            <Suspense fallback={<SettingsSkeleton />}>
              <RequireRole roles={['admin', 'user']}><RateCards /></RequireRole>
            </Suspense>
          } />
          <Route path="/services" element={
            <Suspense fallback={<SettingsSkeleton />}>
              <RequireRole roles={['admin', 'user']}><Services /></RequireRole>
            </Suspense>
          } />
          <Route path="/templates" element={
            <Suspense fallback={<SettingsSkeleton />}>
              <RequireRole roles={['admin', 'user']}><Templates /></RequireRole>
            </Suspense>
          } />
          <Route path="/automations" element={
            <Suspense fallback={<SettingsSkeleton />}>
              <RequireRole roles={['admin', 'user']}><Automations /></RequireRole>
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<SettingsSkeleton />}>
              <Settings />
            </Suspense>
          } />

          {/* AI route */}
          <Route path="/ai" element={
            <Suspense fallback={<PageSkeleton label="AI assistant" />}>
              <AIAssistant />
            </Suspense>
          } />
        </Route>

        <Route path="*" element={
          <Suspense fallback={<BrandSpinner />}>
            <NotFound />
          </Suspense>
        } />
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
