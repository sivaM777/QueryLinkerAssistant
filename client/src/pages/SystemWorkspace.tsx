import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  ExternalLink, 
  Shield, 
  RefreshCw, 
  Settings,
  MessageSquare,
  Calendar,
  FileText,
  Search
} from "lucide-react";

interface WorkspaceConfig {
  embedUrl: string;
  features: string[];
  apiEndpoints: Record<string, string>;
}

interface AuthStatus {
  authenticated: boolean;
  system: string;
  lastSync?: string;
}

export default function SystemWorkspace() {
  const { system } = useParams<{ system: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  const { data: authStatus, isLoading: authLoading } = useQuery<AuthStatus>({
    queryKey: [`/api/auth/${system}/status`],
    enabled: !!system,
  });

  const { data: workspaceConfig, isLoading: configLoading } = useQuery<WorkspaceConfig>({
    queryKey: [`/api/systems/${system}/workspace`],
    enabled: !!system && authStatus?.authenticated,
  });

  const authenticateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/auth/${system}/login`);
      return response as { authUrl: string; redirectUri: string };
    },
    onSuccess: (data) => {
      // Open OAuth window
      const authWindow = window.open(
        data.authUrl,
        'oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      setAuthWindow(authWindow);

      // Poll for completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setAuthWindow(null);
          // Refresh auth status
          queryClient.invalidateQueries({ queryKey: [`/api/auth/${system}/status`] });
        }
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getSystemInfo = (systemType: string) => {
    const configs = {
      slack: {
        name: "Slack",
        icon: "💬",
        color: "bg-purple-600",
        description: "Team communication and collaboration platform"
      },
      teams: {
        name: "Microsoft Teams",
        icon: "💬",
        color: "bg-blue-600",
        description: "Microsoft Teams meetings and chat"
      },
      zendesk: {
        name: "Zendesk",
        icon: "📋",
        color: "bg-green-600",
        description: "Customer support and ticketing system"
      },
      notion: {
        name: "Notion",
        icon: "📝",
        color: "bg-gray-700",
        description: "Documentation and knowledge management"
      },
      linear: {
        name: "Linear",
        icon: "📋",
        color: "bg-purple-700",
        description: "Issue tracking and project management"
      }
    };
    
    return configs[systemType as keyof typeof configs] || {
      name: systemType,
      icon: "🔧",
      color: "bg-gray-600",
      description: "System integration"
    };
  };

  const systemInfo = system ? getSystemInfo(system) : null;

  if (!system || !systemInfo) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            System Not Found
          </h1>
          <Link href="/integrations">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Integrations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return (
      <div className="p-6 space-y-6" data-testid="system-workspace-auth">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/integrations">
              <Button variant="ghost" size="sm" data-testid="back-to-integrations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Integrations
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${systemInfo.color} rounded-xl flex items-center justify-center`}>
                <span className="text-white text-xl">{systemInfo.icon}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemInfo.name}
                </h1>
                <p className="text-gray-500 dark:text-slate-400">
                  {systemInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Required */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <p className="text-gray-600 dark:text-slate-400">
              Connect your {systemInfo.name} account to access your workspace
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What you'll get access to:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• View and interact with your {systemInfo.name} data</li>
                <li>• Real-time synchronization with your account</li>
                <li>• Integrated workflow within QueryLinker</li>
                <li>• Secure OAuth authentication</li>
              </ul>
            </div>
            
            <div className="text-center">
              <Button
                size="lg"
                onClick={() => authenticateMutation.mutate()}
                disabled={authenticateMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="authenticate-button"
              >
                {authenticateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Connect {systemInfo.name} Account
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 dark:text-slate-400 text-center">
              We use secure OAuth 2.0 authentication. Your credentials are never stored on our servers.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated workspace view
  return (
    <div className="p-6 space-y-6" data-testid="system-workspace-authenticated">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/integrations">
            <Button variant="ghost" size="sm" data-testid="back-to-integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Integrations
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${systemInfo.color} rounded-xl flex items-center justify-center`}>
              <span className="text-white text-xl">{systemInfo.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {systemInfo.name} Workspace
              </h1>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Connected
                </Badge>
                {authStatus.lastSync && (
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Last sync: {new Date(authStatus.lastSync).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/auth/${system}/status`] });
              toast({
                title: "Refreshed",
                description: "Workspace data refreshed successfully",
              });
            }}
            data-testid="refresh-workspace"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (workspaceConfig?.embedUrl) {
                window.open(workspaceConfig.embedUrl, '_blank');
              }
            }}
            data-testid="open-external"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in {systemInfo.name}
          </Button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workspaceConfig?.features.map((feature) => (
                <Button
                  key={feature}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    toast({
                      title: "Feature Access",
                      description: `Opening ${feature} in ${systemInfo.name}`,
                    });
                  }}
                >
                  {feature === 'channels' && <MessageSquare className="h-4 w-4 mr-2" />}
                  {feature === 'meetings' && <Calendar className="h-4 w-4 mr-2" />}
                  {feature === 'tickets' && <FileText className="h-4 w-4 mr-2" />}
                  {feature === 'search' && <Search className="h-4 w-4 mr-2" />}
                  {!['channels', 'meetings', 'tickets', 'search'].includes(feature) && 
                    <Settings className="h-4 w-4 mr-2" />}
                  {feature.charAt(0).toUpperCase() + feature.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{systemInfo.name} Interface</span>
                <Badge variant="secondary">Live Workspace</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              {configLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                    <p className="text-gray-500 dark:text-slate-400">Loading workspace...</p>
                  </div>
                </div>
              ) : workspaceConfig?.embedUrl ? (
                <iframe
                  src={workspaceConfig.embedUrl}
                  className="w-full h-full border-0 rounded-b-lg"
                  title={`${systemInfo.name} Workspace`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                      <ExternalLink className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Workspace Integration
                      </h3>
                      <p className="text-gray-500 dark:text-slate-400 mb-4">
                        Your {systemInfo.name} workspace will appear here once fully configured.
                      </p>
                      <Button
                        onClick={() => {
                          if (workspaceConfig?.embedUrl) {
                            window.open(workspaceConfig.embedUrl, '_blank');
                          }
                        }}
                      >
                        Open {systemInfo.name}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                Active
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Connection Status
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {workspaceConfig?.features.length || 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Available Features
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Real-time
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Sync Status
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}