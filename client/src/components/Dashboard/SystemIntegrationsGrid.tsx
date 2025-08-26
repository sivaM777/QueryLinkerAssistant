import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Trash2, RefreshCw, Info, Star, Clock, Database, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";

export default function SystemIntegrationsGrid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [expandedSystem, setExpandedSystem] = useState<number | null>(null);

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
    onSuccess: (_, systemId) => {
      toast({
        title: "System Removed",
        description: "System integration has been removed successfully",
      });
      // Force a refetch to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
      queryClient.refetchQueries({ queryKey: ["/api/systems"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to remove system integration",
        variant: "destructive",
      });
    },
  });

  // Comprehensive system configurations with features
  const getSystemConfig = (system: any) => {
    const configs = {
      jira: {
        icon: "🎯",
        color: "orange",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        description: "Issue tracking and project management",
        features: [
          "Ticket Management",
          "Sprint Planning", 
          "Workflow Automation",
          "Reporting & Analytics",
          "Custom Fields",
          "Integration APIs"
        ],
        capabilities: {
          tickets: "Unlimited",
          projects: "Unlimited",
          workflows: "Custom",
          api: "REST & GraphQL"
        }
      },
      confluence: {
        icon: "📚",
        color: "blue",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        description: "Knowledge base and documentation",
        features: [
          "Page Templates",
          "Space Management",
          "Content Search",
          "Version Control",
          "Comments & Reviews",
          "Export Options"
        ],
        capabilities: {
          pages: "Unlimited",
          spaces: "Unlimited",
          storage: "100GB+",
          api: "REST API"
        }
      },
      github: {
        icon: "💻",
        color: "gray",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        description: "Code repository and issues",
        features: [
          "Repository Management",
          "Pull Requests", 
          "Issue Tracking",
          "Actions (CI/CD)",
          "Security Scanning",
          "Package Registry"
        ],
        capabilities: {
          repos: "Unlimited",
          size: "1GB per repo",
          collaborators: "Unlimited",
          api: "REST & GraphQL"
        }
      },
      servicenow: {
        icon: "☁️",
        color: "teal",
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        borderColor: "border-teal-200 dark:border-teal-800",
        description: "IT service management platform",
        features: [
          "Incident Management",
          "Change Management",
          "Service Catalog",
          "Knowledge Base",
          "SLA Management", 
          "Workflow Engine"
        ],
        capabilities: {
          incidents: "Unlimited",
          users: "Enterprise",
          automation: "Full",
          api: "REST & SOAP"
        }
      },
      slack: {
        icon: "💬",
        color: "purple",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        description: "Team communication and collaboration",
        features: [
          "Channel Management",
          "Direct Messaging",
          "File Sharing",
          "Bot Integration",
          "Video Calls",
          "App Ecosystem"
        ],
        capabilities: {
          channels: "Unlimited",
          members: "10K+",
          storage: "10GB+",
          api: "Web API & Events"
        }
      },
      teams: {
        icon: "💬",
        color: "blue",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        description: "Microsoft Teams communication",
        features: [
          "Team Channels",
          "Video Meetings",
          "File Collaboration",
          "App Integration",
          "SharePoint Sync",
          "Calendar Integration"
        ],
        capabilities: {
          teams: "Unlimited",
          members: "10K+",
          storage: "1TB+",
          api: "Graph API"
        }
      },
      zendesk: {
        icon: "📋",
        color: "green",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        description: "Customer support and ticketing",
        features: [
          "Ticket Management",
          "Customer Portal",
          "Live Chat",
          "Knowledge Base",
          "Analytics",
          "Automation Rules"
        ],
        capabilities: {
          tickets: "Unlimited",
          agents: "Enterprise",
          channels: "Multiple",
          api: "REST API"
        }
      },
      linear: {
        icon: "📋",
        color: "purple",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        description: "Issue tracking and project management",
        features: [
          "Issue Tracking",
          "Project Planning",
          "Sprint Management",
          "Roadmaps",
          "Team Insights",
          "Git Integration"
        ],
        capabilities: {
          issues: "Unlimited",
          projects: "Unlimited",
          teams: "Multiple",
          api: "GraphQL"
        }
      },
      notion: {
        icon: "📝",
        color: "gray",
        bgColor: "bg-gray-50 dark:bg-gray-900/20",
        borderColor: "border-gray-200 dark:border-gray-800",
        description: "Documentation and knowledge management",
        features: [
          "Page Creation",
          "Database Management",
          "Template Library",
          "Collaboration",
          "Publishing",
          "API Integration"
        ],
        capabilities: {
          pages: "Unlimited",
          blocks: "Unlimited",
          storage: "10GB+",
          api: "REST API"
        }
      },
      "servicenow-itsm": {
        icon: "📋",
        color: "teal",
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        borderColor: "border-teal-200 dark:border-teal-800",
        description: "ServiceNow ITSM platform",
        features: [
          "ITSM Processes",
          "Change Management",
          "Asset Management",
          "Service Catalog",
          "Reporting",
          "Integrations"
        ],
        capabilities: {
          processes: "Full ITIL",
          users: "Enterprise",
          automation: "Advanced",
          api: "REST & SOAP"
        }
      },
    };

    return configs[system.type as keyof typeof configs] || {
      icon: "🔧",
      color: "gray",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      borderColor: "border-gray-200 dark:border-gray-800",
      description: "Custom integration",
      features: ["Custom API", "Data Sync", "Webhooks"],
      capabilities: {
        endpoints: "Custom",
        auth: "Various",
        data: "JSON/XML",
        api: "Custom"
      }
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex gap-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Integrations
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Connected systems and their advanced features
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/integrations")}
            data-testid="add-system-button"
          >
            + Add System
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(systems || []).map((system: any, index: number) => {
            const config = getSystemConfig(system);
            const lastSync = system.lastSyncAt
              ? new Date(system.lastSyncAt).toLocaleString()
              : 'Never';
            const isExpanded = expandedSystem === system.id;

            return (
              <motion.div
                key={system.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group h-full"
              >
                <Card
                  className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${config.bgColor} ${config.borderColor} border-2 flex flex-col`}
                  data-testid={`system-card-${system.type}`}
                >
                  <CardContent className="p-6 flex flex-col h-full flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="text-2xl flex-shrink-0">{config.icon}</div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {system.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span className="truncate">Last sync: {lastSync}</span>
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={system.isActive ? "default" : "secondary"}
                        className={`${system.isActive ? "bg-green-500 hover:bg-green-500" : ""} flex-shrink-0 ml-2`}
                      >
                        {system.isActive ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-2">
                      {config.description}
                    </p>

                    {/* System Info */}
                    <div className="space-y-3 mb-4 flex-grow">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">Type:</span>
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {system.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">Status:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {system.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      {/* Features Preview */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                            Key Features
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedSystem(isExpanded ? null : system.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {!isExpanded && (
                          <div className="flex flex-wrap gap-1">
                            {config.features?.slice(0, 3).map((feature, i) => (
                              <Badge key={i} variant="outline" className="text-xs px-2 py-0">
                                {feature}
                              </Badge>
                            ))}
                            {config.features?.length > 3 && (
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                +{config.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Expanded Features */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                                All Features:
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {config.features?.map((feature, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                                Capabilities:
                              </h5>
                              <div className="grid grid-cols-1 gap-1 text-xs">
                                {Object.entries(config.capabilities || {}).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-500 dark:text-slate-400 capitalize">
                                      {key}:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        {system.isActive && ['slack', 'googlemeet', 'zendesk', 'notion', 'linear'].includes(system.type) ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setLocation(`/workspace/${system.type}`)}
                            data-testid={`workspace-button-${system.type}`}
                            className="flex-1"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Workspace
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncMutation.mutate(system.id)}
                            disabled={syncMutation.isPending}
                            data-testid={`sync-button-${system.type}`}
                            className="flex-1"
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            Sync
                          </Button>
                        )}

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Settings",
                                description: `${system.name} settings will be available in a future update`,
                              });
                            }}
                            data-testid={`settings-button-${system.type}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to remove ${system.name}? All associated solutions will be deleted.`)) {
                                try {
                                  await deleteMutation.mutateAsync(system.id);
                                } catch (error) {
                                  console.error('Delete failed:', error);
                                }
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`delete-button-${system.type}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Empty state */}
          {(!systems || systems.length === 0) && !isLoading && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Database className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No System Integrations
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                Connect your first system to start managing integrations
              </p>
              <Button
                onClick={() => setLocation("/integrations")}
                data-testid="go-to-integrations"
              >
                Add Your First Integration
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
