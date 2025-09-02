import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bug, Plus, AlertCircle, CheckCircle, Clock, User, Tag, ExternalLink, Search } from "lucide-react";

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  issueType: string;
  assignee?: {
    displayName: string;
    avatarUrl?: string;
  };
  reporter?: {
    displayName: string;
    avatarUrl?: string;
  };
  created: string;
  updated: string;
  description?: string;
  project: {
    key: string;
    name: string;
  };
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectType: string;
}

export default function JiraPanel() {
  const [newIssue, setNewIssue] = useState({ 
    summary: "", 
    description: "", 
    priority: "Medium", 
    issueType: "Task",
    projectKey: ""
  });
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Jira projects
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<JiraProject[]>({
    queryKey: ['/api/integrations/jira/projects'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/jira/projects');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch projects');
      }
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch Jira issues
  const { data: issues = [], isLoading: issuesLoading, error: issuesError } = useQuery<JiraIssue[]>({
    queryKey: ['/api/integrations/jira/issues', selectedProject, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiRequest(`/api/integrations/jira/issues?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch issues');
      }
      return await response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });

  const createIssueMutation = useMutation({
    mutationFn: async (issueData: typeof newIssue) => {
      const response = await apiRequest('/api/integrations/jira/issues', {
        method: 'POST',
        body: JSON.stringify(issueData),
      });
      if (!response.ok) throw new Error('Failed to create issue');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Issue Created",
        description: "Jira issue has been created successfully",
      });
      setNewIssue({ summary: "", description: "", priority: "Medium", issueType: "Task", projectKey: "" });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/jira/issues'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Issue",
        description: error.message || "An error occurred while creating the issue",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'To Do': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Done': 'bg-green-100 text-green-800',
      'Open': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Highest': 'bg-red-100 text-red-800',
      'High': 'bg-orange-100 text-orange-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-blue-100 text-blue-800',
      'Lowest': 'bg-gray-100 text-gray-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Highest':
      case 'High':
        return <AlertCircle className="h-4 w-4" />;
      case 'Medium':
        return <Clock className="h-4 w-4" />;
      case 'Low':
      case 'Lowest':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'story':
      case 'task':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const filteredIssues = issues.filter(issue =>
    issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show error state if Jira integration is not properly configured
  if (projectsError || issuesError) {
    const errorMessage = (projectsError as any)?.message || (issuesError as any)?.message || 'Jira integration error';
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Jira Integration
            <Badge variant="destructive">Connection Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Jira Integration Not Configured
              </h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">
                {errorMessage.includes('not connected') ? 
                  'Your Jira account needs to be properly connected with OAuth configuration.' :
                  errorMessage
                }
              </p>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/integrations/jira/projects'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/integrations/jira/issues'] });
                }}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Jira Integration
          <Badge variant="secondary">Connected</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="create">Create Issue</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-issues"
                />
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.key}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-3">
                {issuesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : filteredIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No issues found
                  </div>
                ) : (
                  filteredIssues.map(issue => (
                    <div key={issue.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getIssueTypeIcon(issue.issueType)}
                            <span className="font-medium text-blue-600" data-testid={`text-issue-key-${issue.key}`}>
                              {issue.key}
                            </span>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status}
                            </Badge>
                            <Badge className={getPriorityColor(issue.priority)} variant="outline">
                              {getPriorityIcon(issue.priority)}
                              {issue.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-foreground" data-testid={`text-issue-summary-${issue.key}`}>
                            {issue.summary}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{issue.project.name} ({issue.project.key})</span>
                            {issue.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {issue.assignee.displayName}
                              </div>
                            )}
                            <span>Updated {new Date(issue.updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(`/incident/${issue.key}`, '_blank')}
                          data-testid={`button-view-issue-${issue.key}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="grid gap-3">
                {projectsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No projects found
                  </div>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium flex items-center gap-2" data-testid={`text-project-name-${project.key}`}>
                            {project.name}
                            <Badge variant="outline">{project.key}</Badge>
                          </h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Type: {project.projectType}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProject(project.key)}
                          data-testid={`button-select-project-${project.key}`}
                        >
                          View Issues
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project</label>
                <Select 
                  value={newIssue.projectKey} 
                  onValueChange={(value) => setNewIssue({ ...newIssue, projectKey: value })}
                >
                  <SelectTrigger data-testid="select-project-create">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.key}>
                        {project.name} ({project.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Summary</label>
                <Input
                  value={newIssue.summary}
                  onChange={(e) => setNewIssue({ ...newIssue, summary: e.target.value })}
                  placeholder="Brief description of the issue..."
                  data-testid="input-issue-summary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Issue Type</label>
                  <Select 
                    value={newIssue.issueType} 
                    onValueChange={(value) => setNewIssue({ ...newIssue, issueType: value })}
                  >
                    <SelectTrigger data-testid="select-issue-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Task">Task</SelectItem>
                      <SelectItem value="Bug">Bug</SelectItem>
                      <SelectItem value="Story">Story</SelectItem>
                      <SelectItem value="Epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={newIssue.priority} 
                    onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Highest">Highest</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Lowest">Lowest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  data-testid="textarea-issue-description"
                />
              </div>

              <Button 
                onClick={() => createIssueMutation.mutate(newIssue)}
                disabled={!newIssue.summary.trim() || !newIssue.projectKey || createIssueMutation.isPending}
                className="w-full"
                data-testid="button-create-issue"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}