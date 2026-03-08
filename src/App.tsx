import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Notifications from "@/pages/Notifications";
import Clients from "@/pages/Clients";
import Contacts from "@/pages/Contacts";
import Deals from "@/pages/Deals";
import Meetings from "@/pages/Meetings";
import Proposals from "@/pages/Proposals";
import Contracts from "@/pages/Contracts";
import Forms from "@/pages/Forms";
import ClientPortal from "@/pages/ClientPortal";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";
import TimeTracking from "@/pages/TimeTracking";
import Resourcing from "@/pages/Resourcing";
import Timesheets from "@/pages/Timesheets";
import Invoices from "@/pages/Invoices";
import Scheduling from "@/pages/Scheduling";
import PurchaseOrders from "@/pages/PurchaseOrders";
import RateCards from "@/pages/RateCards";
import Services from "@/pages/Services";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CreateDealDialog } from "@/components/dialogs/CreateDealDialog";
import { CreateTaskDialog } from "@/components/dialogs/CreateTaskDialog";
import { CreateClientDialog } from "@/components/dialogs/CreateClientDialog";
import { CreateContactDialog } from "@/components/dialogs/CreateContactDialog";
import { useState, createContext, useContext, useCallback } from "react";

const queryClient = new QueryClient();

interface DialogContextType {
  openCreateDeal: () => void;
  openCreateTask: () => void;
  openCreateClient: () => void;
  openCreateContact: () => void;
}

export const DialogContext = createContext<DialogContextType>({
  openCreateDeal: () => {},
  openCreateTask: () => {},
  openCreateClient: () => {},
  openCreateContact: () => {},
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

function AppShell() {
  const [dealOpen, setDealOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const dialogs: DialogContextType = {
    openCreateDeal: useCallback(() => setDealOpen(true), []),
    openCreateTask: useCallback(() => setTaskOpen(true), []),
    openCreateClient: useCallback(() => setClientOpen(true), []),
    openCreateContact: useCallback(() => setContactOpen(true), []),
  };

  return (
    <DialogContext.Provider value={dialogs}>
      <CommandPalette
        onCreateDeal={dialogs.openCreateDeal}
        onCreateTask={dialogs.openCreateTask}
        onCreateClient={dialogs.openCreateClient}
        onCreateContact={dialogs.openCreateContact}
      />
      <CreateDealDialog open={dealOpen} onOpenChange={setDealOpen} />
      <CreateTaskDialog open={taskOpen} onOpenChange={setTaskOpen} />
      <CreateClientDialog open={clientOpen} onOpenChange={setClientOpen} />
      <CreateContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/client-portal" element={<ClientPortal />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/resourcing" element={<Resourcing />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/rate-cards" element={<RateCards />} />
          <Route path="/services" element={<Services />} />
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
