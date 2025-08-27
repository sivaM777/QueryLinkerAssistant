import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import MetricsCards from "@/components/Dashboard/MetricsCards";
import RecentSearches from "@/components/Dashboard/RecentSearches";
import SLAStatus from "@/components/Dashboard/SLAStatus";
import QuickActions from "@/components/Dashboard/QuickActions";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import ActiveIncidents from "@/components/Dashboard/ActiveIncidents";
import SearchModal from "@/components/SearchModal";
import SystemFeaturesPanel from "@/components/SystemFeatures/SystemFeaturesPanel";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  });

  // Fetch active incidents count for metrics
  const { data: activeIncidents } = useQuery({
    queryKey: ["/api/incidents/active"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch data sources for metrics
  const { data: dataSources } = useQuery({
    queryKey: ["/api/data-sources"],
  });

  // Enhanced metrics with real-time incident data
  const enhancedMetrics = metrics ? {
    ...metrics,
    activeIncidents: Array.isArray(activeIncidents) ? activeIncidents.length : (metrics as any).activeIncidents || 0,
    criticalIncidents: Array.isArray(activeIncidents) ? activeIncidents.filter((i: any) => i.severity === 'critical').length : (metrics as any).criticalIncidents || 0,
    dataSourcesActive: Array.isArray(dataSources) ? dataSources.filter((ds: any) => ds.isActive).length : (metrics as any).dataSourcesActive || 0,
  } : undefined;


  return (
    <div className="min-h-screen space-y-6 animate-fadeIn" data-testid="dashboard-page">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 lg:px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-slate-400">IT Service Management Overview</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        <MetricsCards metrics={enhancedMetrics as any} isLoading={metricsLoading} />

        <ActiveIncidents />


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentSearches onSearchOpen={(query) => {
            setIsSearchOpen(true);
            // Pass the query to search modal if needed
          }} />
          <SLAStatus />
        </div>

        <QuickActions />


        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentActivity />
          <SystemFeaturesPanel />
        </div>
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
