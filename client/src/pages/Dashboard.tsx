import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import MetricsCards from "@/components/Dashboard/MetricsCards";
import SystemIntegrationsGrid from "@/components/Dashboard/SystemIntegrationsGrid";
import RecentSearches from "@/components/Dashboard/RecentSearches";
import SLAStatus from "@/components/Dashboard/SLAStatus";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import ActiveIncidents from "@/components/Dashboard/ActiveIncidents";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Logout failed' }));
        throw new Error(errorData.message || 'Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      queryClient.clear();
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // WebSocket for real-time updates
  useWebSocket((message) => {
    if (message.type === 'system_sync') {
      toast({
        title: "System Sync Complete",
        description: `System updated successfully`,
      });
    }
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    enabled: isAuthenticated,
  });

  // Fetch active incidents count for metrics
  const { data: activeIncidents } = useQuery({
    queryKey: ["/api/incidents/active"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch data sources for metrics
  const { data: dataSources } = useQuery({
    queryKey: ["/api/data-sources"],
    enabled: isAuthenticated,
  });

  // Enhanced metrics with real-time incident data
  const enhancedMetrics = metrics ? {
    ...metrics,
    activeIncidents: Array.isArray(activeIncidents) ? activeIncidents.length : 0,
    criticalIncidents: Array.isArray(activeIncidents) ? activeIncidents.filter((i: any) => i.severity === 'critical').length : 0,
    dataSourcesActive: Array.isArray(dataSources) ? dataSources.filter((ds: any) => ds.isActive).length : 0,
  } : undefined;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-page">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-400">IT Service Management Overview</p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Welcome, {user.firstName || user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="logout-button"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        <MetricsCards metrics={enhancedMetrics} isLoading={metricsLoading} />
      
      <ActiveIncidents />
      
      <SystemIntegrationsGrid />
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSearches />
          <SLAStatus />
        </div>
        
        <QuickActions />
        
        <RecentActivity />
      </div>
    </div>
  );
}
