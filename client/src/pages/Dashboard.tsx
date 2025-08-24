import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
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
  const { isAuthenticated, isLoading } = useAuth();

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
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
    },
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
    activeIncidents: activeIncidents?.length || 0,
    criticalIncidents: activeIncidents?.filter((i: any) => i.severity === 'critical').length || 0,
    dataSourcesActive: dataSources?.filter((ds: any) => ds.isActive).length || 0,
  } : undefined;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="dashboard-page">
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
  );
}
