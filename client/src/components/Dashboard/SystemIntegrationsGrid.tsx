import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function SystemIntegrationsGrid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: systems, isLoading } = useQuery({
    queryKey: ["/api/systems"],
  });

  const syncMutation = useMutation({
    mutationFn: async (systemId: number) => {
      await apiRequest("POST", `/api/systems/${systemId}/sync`);
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "System synchronized successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (systemId: number) => {
      await apiRequest("DELETE", `/api/systems/${systemId}`);
    },
    onSuccess: () => {
      toast({
        title: "System Removed",
        description: "System integration has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to remove system integration",
        variant: "destructive",
      });
    },
  });

  // System type configurations for display
  const getSystemConfig = (system: any) => {
    const configs = {
      jira: {
        icon: "🎯",
        color: "orange",
        description: "Issue tracking and project management",
      },
      confluence: {
        icon: "📚",
        color: "blue",
        description: "Knowledge base and documentation",
      },
      github: {
        icon: "💻",
        color: "gray",
        description: "Code repository and issues",
      },
      servicenow: {
        icon: "☁️",
        color: "teal",
        description: "IT service management platform",
      },
      slack: {
        icon: "💬",
        color: "purple",
        description: "Team communication and collaboration",
      },
      teams: {
        icon: "💬",
        color: "blue",
        description: "Microsoft Teams communication",
      },
      zendesk: {
        icon: "📋",
        color: "green",
        description: "Customer support and ticketing",
      },
      linear: {
        icon: "📋",
        color: "purple",
        description: "Issue tracking and project management",
      },
      notion: {
        icon: "📝",
        color: "gray",
        description: "Documentation and knowledge management",
      },
      "servicenow-itsm": {
        icon: "📋",
        color: "teal",
        description: "IT service management platform",
      },
    };

    return configs[system.type as keyof typeof configs] || {
      icon: "🔧",
      color: "gray",
      description: "Custom integration",
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-3 w-3 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="system-integrations">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Integrations</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Connected systems and their status
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/integrations?action=add")}
            data-testid="add-system-button"
          >
            + Add System
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemConfigs.map((system, index) => {
            const isConnected = true; // Mock connection status
            const lastSync = `${Math.floor(Math.random() * 10) + 1} min ago`;

            return (
              <motion.div
                key={system.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                data-testid={`system-card-${system.type}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">{system.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {system.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Last sync: {lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={isConnected ? "default" : "secondary"}
                      className={isConnected ? "bg-green-500 hover:bg-green-500" : ""}
                    >
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
                  {system.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Records</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {system.recordCount}
                    </span>
                  </div>
                  <Progress 
                    value={system.syncProgress} 
                    className="h-2"
                    data-testid={`sync-progress-${system.type}`}
                  />
                  <div className="text-xs text-gray-500 dark:text-slate-400 text-right">
                    {system.syncProgress}% synced
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => syncMutation.mutate(index + 1)}
                    disabled={syncMutation.isPending}
                    data-testid={`sync-button-${system.type}`}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/integrations/${system.type}/settings`)}
                      data-testid={`settings-button-${system.type}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${system.name}?`)) {
                          deleteMutation.mutate(index + 1);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-button-${system.type}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
