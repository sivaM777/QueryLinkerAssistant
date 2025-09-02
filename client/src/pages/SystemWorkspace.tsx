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
  Search,
  Video,
  Plus,
  Clock,
  Users
} from "lucide-react";
import SlackPanel from "@/components/SystemPanels/SlackPanel";
import JiraPanel from "@/components/SystemPanels/JiraPanel";
import ZendeskPanel from "@/components/SystemPanels/ZendeskPanel";
import NotionPanel from "@/components/SystemPanels/NotionPanel";
import LinearPanel from "@/components/SystemPanels/LinearPanel";
import ServiceNowPanel from "@/components/SystemPanels/ServiceNowPanel";

interface WorkspaceConfig {
  embedUrl: string | null;
  features: string[];
  apiEndpoints: Record<string, string>;
  customInterface?: boolean;
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

  // Slack Custom Interface Component
  function SlackInterface({ systemInfo }: { systemInfo: any }) {
    return (
      <div className="h-full p-4">
        <SlackPanel />
      </div>
    );
  }

  // Google Meet Custom Interface Component
  function GoogleMeetInterface({ systemInfo }: { systemInfo: any }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      attendees: ''
    });

    const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
      queryKey: ['/api/integrations/googlemeet/meetings'],
      enabled: authStatus?.authenticated,
    });

    const createMeetingMutation = useMutation({
      mutationFn: async (meetingData: any) => {
        return await apiRequest('/api/googlemeet/meetings', {
          method: 'POST',
          body: JSON.stringify({
            ...meetingData,
            userId: 'demo_user', // In production, get from auth
            attendees: meetingData.attendees.split(',').map((email: string) => email.trim()).filter(Boolean)
          }),
        });
      },
      onSuccess: () => {
        toast({
          title: "Meeting Created",
          description: "Your Google Meet meeting has been created successfully",
        });
        setShowCreateForm(false);
        setNewMeeting({ title: '', description: '', startTime: '', endTime: '', attendees: '' });
        queryClient.invalidateQueries({ queryKey: ['/api/integrations/googlemeet/meetings'] });
      },
      onError: (error) => {
        toast({
          title: "Failed to create meeting",
          description: error.message,
          variant: "destructive",
        });
      },
    });

    if (!authStatus?.authenticated) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
              <Video className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Connect to Google Meet
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                Authenticate with Google to access your meetings and create new ones.
              </p>
              <Button
                onClick={() => authenticateMutation.mutate()}
                disabled={authenticateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {authenticateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Connect Google Meet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Google Meet Integration</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Manage your meetings and collaborations</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Meeting
          </Button>
        </div>

        {/* Create Meeting Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Meeting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    placeholder="Meeting title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Attendees (emails)</label>
                  <input
                    type="text"
                    value={newMeeting.attendees}
                    onChange={(e) => setNewMeeting({ ...newMeeting, attendees: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                  rows={3}
                  placeholder="Meeting description (optional)"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => createMeetingMutation.mutate(newMeeting)}
                  disabled={createMeetingMutation.isPending || !newMeeting.title || !newMeeting.startTime || !newMeeting.endTime}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createMeetingMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Meeting'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meetings List */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Recent & Upcoming Meetings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">No meetings found</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">Create your first meeting to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting: any) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Video className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {meeting.attendees} attendees
                          </span>
                          <Badge variant={meeting.status === 'upcoming' ? 'default' : 'secondary'}>
                            {meeting.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meeting.meetLink && (
                        <Button
                          size="sm"
                          onClick={() => window.open(meeting.meetLink, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSystemInfo = (systemType: string) => {
    const configs = {
      slack: {
        name: "Slack",
        icon: "💬",
        color: "bg-purple-600",
        description: "Team communication and collaboration platform"
      },
      googlemeet: {
        name: "Google Meet",
        icon: "📹",
        color: "bg-blue-600",
        description: "Video meetings and collaboration"
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
      },
      jira: {
        name: "Jira",
        icon: "🎯",
        color: "bg-orange-600",
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
              ) : system === 'slack' && workspaceConfig?.customInterface ? (
                <SlackInterface systemInfo={systemInfo} />
              ) : system === 'jira' ? (
                <div className="p-6 bg-white dark:bg-slate-800 min-h-[400px]">
                  <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">🎯 Jira Workspace</h2>
                    <p className="text-blue-700 dark:text-blue-200">System: {system}</p>
                    <p className="text-blue-700 dark:text-blue-200">Auth Status: {authStatus?.authenticated ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  <JiraPanel />
                </div>
              ) : system === 'googlemeet' && workspaceConfig?.customInterface ? (
                <GoogleMeetInterface systemInfo={systemInfo} />
              ) : system === 'zendesk' ? (
                <div className="p-6 bg-white dark:bg-slate-800 min-h-[400px]">
                  <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100">🎫 Zendesk Workspace</h2>
                    <p className="text-orange-700 dark:text-orange-200">System: {system}</p>
                    <p className="text-orange-700 dark:text-orange-200">Auth Status: {authStatus?.authenticated ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  <ZendeskPanel />
                </div>
              ) : system === 'notion' ? (
                <div className="p-6 bg-white dark:bg-slate-800 min-h-[400px]">
                  <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">📝 Notion Workspace</h2>
                    <p className="text-gray-700 dark:text-gray-200">System: {system}</p>
                    <p className="text-gray-700 dark:text-gray-200">Auth Status: {authStatus?.authenticated ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  <NotionPanel />
                </div>
              ) : system === 'linear' ? (
                <div className="p-6 bg-white dark:bg-slate-800 min-h-[400px]">
                  <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">📈 Linear Workspace</h2>
                    <p className="text-purple-700 dark:text-purple-200">System: {system}</p>
                    <p className="text-purple-700 dark:text-purple-200">Auth Status: {authStatus?.authenticated ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  <LinearPanel />
                </div>
              ) : system === 'servicenow' ? (
                <div className="p-6 bg-white dark:bg-slate-800 min-h-[400px]">
                  <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg mb-4">
                    <h2 className="text-xl font-bold text-green-900 dark:text-green-100">🔧 ServiceNow Workspace</h2>
                    <p className="text-green-700 dark:text-green-200">System: {system}</p>
                    <p className="text-green-700 dark:text-green-200">Auth Status: {authStatus?.authenticated ? 'Connected' : 'Not Connected'}</p>
                  </div>
                  <ServiceNowPanel />
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