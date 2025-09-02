import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import SystemIntegrations from "@/pages/SystemIntegrations";
import SLAManagement from "@/pages/SLAManagement";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Settings from "@/pages/Settings";
import Activity from "@/pages/Activity";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import SystemWorkspace from "@/pages/SystemWorkspace";
import IncidentManagement from "@/pages/IncidentManagement";
import AdvancedAnalytics from "@/pages/AdvancedAnalytics";
import SlackCommands from "@/pages/SlackCommands";
import SlackInterface from "@/pages/SlackInterface";
import NotionWorkspace from "@/pages/NotionWorkspace";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyResetCode from "@/pages/VerifyResetCode";
import ResetPassword from "@/pages/ResetPassword";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";
import { useState, useEffect } from "react";
import SearchModal from "@/components/SearchModal";
import FloatingActionButton from "@/components/FloatingActionButton";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [setLocation, to]);
  return null;
}

function Router() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect to landing if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!isAuthenticated && location !== "/login" && location !== "/landing" && location !== "/" && location !== "/forgot-password" && location !== "/verify-reset-code" && !location.startsWith("/reset-password")) {
      setLocation("/landing");
    }
  }, [isAuthenticated, location, setLocation]);

  // Check if current route should show the dashboard layout
  const isDashboardRoute = location !== "/landing" && location !== "/login" && location !== "/forgot-password" && location !== "/verify-reset-code" && !location.startsWith("/reset-password") && isAuthenticated;

  if (!isDashboardRoute) {
    // Render landing or login page without dashboard layout
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/landing" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/verify-reset-code" component={VerifyResetCode} />
        <Route path="/reset-password" component={ResetPassword} />
      </Switch>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 w-full transition-all duration-300 ease-in-out overflow-x-hidden lg:ml-[var(--sidebar-width,16rem)]">
          <Header onSearchOpen={() => setIsSearchOpen(true)} />
          <div className="w-full max-w-none">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/analytics/advanced" component={AdvancedAnalytics} />
              <Route path="/servicenow/incidents" component={IncidentManagement} />
              <Route path="/incidents" component={IncidentManagement} />
              <Route path="/slack/commands" component={SlackCommands} />
              <Route path="/slack/interface" component={SlackInterface} />
              <Route path="/notion/workspace" component={NotionWorkspace} />
              <Route path="/integrations" component={SystemIntegrations} />
              <Route path="/sla" component={SLAManagement} />
              <Route path="/knowledge" component={KnowledgeBase} />
              <Route path="/activity" component={Activity} />
              <Route path="/settings" component={Settings} />
              <Route path="/workspace/:system" component={SystemWorkspace} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <FloatingActionButton />
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
