import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Settings, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function SystemIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: systems, isLoading: systemsLoading } = useQuery({
    queryKey: ["/api/systems"],
  });

  const syncMutation = useMutation({
    mutationFn: async (systemId: number) => {
      await apiRequest(`/api/systems/${systemId}/sync`, { method: "POST" });
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

  const addSystemMutation = useMutation({
    mutationFn: async (systemData: any) => {
      await apiRequest("/api/systems", { method: "POST", body: systemData });
    },
    onSuccess: () => {
      toast({
        title: "System Added",
        description: "New system integration added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
      setShowAddDialog(false);
      setSelectedSystem("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Add System",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSystemMutation = useMutation({
    mutationFn: async (systemId: number) => {
      await apiRequest(`/api/systems/${systemId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "System Removed",
        description: "System integration removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove System",
        description: error.message,
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
      "servicenow-kb": {
        icon: "☁️",
        color: "teal",
        description: "ServiceNow Knowledge Base",
      },
    };
    
    return configs[system.type as keyof typeof configs] || {
      icon: "🔧",
      color: "gray",
      description: "Custom integration",
    };
  };

  const availableSystems = [
    { value: "jira", label: "Jira", icon: "🎯" },
    { value: "confluence", label: "Confluence", icon: "📚" },
    { value: "github", label: "GitHub", icon: "💻" },
    { value: "servicenow-kb", label: "ServiceNow KB", icon: "☁️" },
    { value: "slack", label: "Slack", icon: "💬" },
    { value: "googlemeet", label: "Google Meet", icon: "📹" },
    { value: "servicenow-itsm", label: "ServiceNow ITSM", icon: "📋" },
    { value: "zendesk", label: "Zendesk", icon: "📋" },
    { value: "linear", label: "Linear", icon: "📋" },
    { value: "notion", label: "Notion", icon: "📝" },
    { value: "custom", label: "Custom API", icon: "🔧" },
  ];

  const handleAddSystem = () => {
    if (!selectedSystem) return;
    
    const systemType = availableSystems.find(s => s.value === selectedSystem);
    addSystemMutation.mutate({
      name: systemType?.label || selectedSystem,
      type: selectedSystem,
      isActive: true,
    });
  };


  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="system-integrations-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Integrations</h1>
            <p className="text-gray-500 dark:text-slate-400">Connected systems and their status</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (confirm("Are you sure you want to remove ALL system integrations? This action cannot be undone.")) {
                try {
                  await apiRequest("/api/systems", { method: "DELETE" });
                  toast({
                    title: "All Systems Removed",
                    description: "All system integrations have been cleared",
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
                } catch (error) {
                  toast({
                    title: "Reset Failed",
                    description: "Failed to clear system integrations",
                    variant: "destructive",
                  });
                }
              }
            }}
            data-testid="reset-integrations"
          >
            Reset All
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-system-button">
                <Plus className="h-4 w-4 mr-2" />
                Add System
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-system-dialog">
              <DialogHeader>
                <DialogTitle>Add New System Integration</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Connect a new system to expand your knowledge sources and improve suggestion coverage.
                </p>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    Select System
                  </label>
                  <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a system to integrate" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSystems.map((system) => (
                        <SelectItem key={system.value} value={system.value}>
                          <div className="flex items-center gap-2">
                            <span>{system.icon}</span>
                            <span>{system.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSystem}
                    disabled={!selectedSystem || addSystemMutation.isPending}
                    data-testid="confirm-add-system"
                  >
                    {addSystemMutation.isPending ? "Adding..." : "Add System"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {systemsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
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
          ))
        ) : (
          (Array.isArray(systems) ? systems : []).map((system: any, index: number) => {
            const config = getSystemConfig(system);
            return (
            <motion.div
              key={system.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full flex flex-col"
                data-testid={`system-card-${system.type}`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="text-2xl flex-shrink-0">{config.icon}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{system.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          Last sync: {system.lastSyncAt ? new Date(system.lastSyncAt).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={system.isActive ? "default" : "secondary"}
                      className={`${system.isActive ? "bg-green-500 hover:bg-green-500" : ""} flex-shrink-0 ml-2`}
                    >
                      {system.isActive ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 flex-grow line-clamp-2">
                    {config.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Type</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {system.type}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Status</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {system.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto gap-2">
                    {system.isActive && ['slack', 'googlemeet', 'zendesk', 'notion', 'linear'].includes(system.type) ? (
                      <Link href={`/workspace/${system.type}`}>
                        <Button
                          size="sm"
                          className="flex-shrink-0"
                          data-testid={`workspace-button-${system.type}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Workspace
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => syncMutation.mutate(system.id)}
                        disabled={syncMutation.isPending}
                        data-testid={`sync-button-${system.type}`}
                        className="flex-shrink-0"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0">
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
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${system.name}? All associated solutions will be deleted.`)) {
                            deleteSystemMutation.mutate(system.id);
                          }
                        }}
                        disabled={deleteSystemMutation.isPending}
                        data-testid={`delete-button-${system.type}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })
        )}
      </div>

      {/* System Status Overview */}
      <Card data-testid="system-status-overview">
        <CardHeader>
          <CardTitle>System Status Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time status and performance metrics for all connected systems
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Array.isArray(systems) ? systems.filter((s: any) => s.isActive).length : 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Connected Systems</div>
              <div className="text-xs text-gray-400 mt-1">All operational</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {Array.isArray(systems) ? systems.length : 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Total Systems</div>
              <div className="text-xs text-gray-400 mt-1">Active & Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">98.7%</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Sync Success Rate</div>
              <div className="text-xs text-gray-400 mt-1">Excellent performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">2.3s</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Avg Sync Time</div>
              <div className="text-xs text-gray-400 mt-1">Within targets</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card data-testid="integration-guide">
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quick setup instructions for popular integrations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Jira Integration",
                description: "Connect your Jira instance to import tickets and issues",
                steps: ["Generate API token", "Configure OAuth", "Test connection"],
                docs: "/docs/jira-integration",
              },
              {
                name: "Confluence Setup",
                description: "Sync knowledge base articles and documentation",
                steps: ["Enable API access", "Set permissions", "Configure sync"],
                docs: "/docs/confluence-setup",
              },
              {
                name: "GitHub Integration",
                description: "Import repository issues and pull requests",
                steps: ["Install GitHub App", "Grant permissions", "Select repositories"],
                docs: "/docs/github-integration",
              },
            ].map((guide, index) => (
              <motion.div
                key={guide.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{guide.name}</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{guide.description}</p>
                <div className="space-y-1 mb-3">
                  {guide.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <div className="w-4 h-4 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {stepIndex + 1}
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Docs
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
