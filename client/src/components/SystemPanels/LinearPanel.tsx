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
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bug, Plus, CheckCircle, Circle, AlertCircle, Clock, User, Tag } from "lucide-react";

export default function LinearPanel() {
  const [newIssue, setNewIssue] = useState({ title: "", description: "", priority: "medium", status: "todo", labels: [] });
  const [selectedProject, setSelectedProject] = useState("web-app");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real Linear API calls
  const projects = [
    { id: "web-app", name: "Web Application", color: "#3B82F6", issues: 15, progress: 68 },
    { id: "mobile", name: "Mobile App", color: "#10B981", issues: 8, progress: 45 },
    { id: "api", name: "Backend API", color: "#F59E0B", issues: 12, progress: 82 },
  ];

  const issues = [
    {
      id: "WEB-123",
      title: "Fix authentication flow bug",
      status: "in_progress",
      priority: "high",
      assignee: { name: "John Doe", avatar: "" },
      labels: ["bug", "authentication"],
      created: "2 days ago",
      project: "web-app",
      description: "Users are experiencing issues with the login flow after the recent update."
    },
    {
      id: "WEB-124",
      title: "Implement dark mode toggle",
      status: "todo",
      priority: "medium",
      assignee: { name: "Sarah Smith", avatar: "" },
      labels: ["feature", "ui"],
      created: "1 day ago",
      project: "web-app",
      description: "Add a dark mode toggle to the user settings panel."
    },
    {
      id: "MOB-045",
      title: "App crashes on startup",
      status: "done",
      priority: "urgent",
      assignee: { name: "Mike Johnson", avatar: "" },
      labels: ["bug", "critical"],
      created: "3 days ago",
      project: "mobile",
      description: "Mobile app crashes immediately after launch on iOS 17."
    },
  ];

  const createIssue = useMutation({
    mutationFn: async (issueData: any) => {
      // Replace with actual Linear API call
      await apiRequest("/api/integrations/linear/issues", { method: "POST", body: JSON.stringify({ ...issueData, project: selectedProject }) });
    },
    onSuccess: () => {
      setNewIssue({ title: "", description: "", priority: "medium", status: "todo", labels: [] });
      toast({
        title: "Issue Created",
        description: "Your Linear issue has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/linear/issues"] });
    },
    onError: () => {
      toast({
        title: "Failed to Create Issue",
        description: "Could not create Linear issue",
        variant: "destructive",
      });
    },
  });

  const updateIssue = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Replace with actual Linear API call
      await apiRequest(`/api/integrations/linear/issues/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onSuccess: () => {
      toast({
        title: "Issue Updated",
        description: "Issue has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/linear/issues"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update issue",
        variant: "destructive",
      });
    },
  });

  const handleCreateIssue = () => {
    if (!newIssue.title || !newIssue.description) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }
    createIssue.mutate(newIssue);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo": return <Circle className="h-4 w-4 text-gray-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "done": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      todo: "secondary",
      in_progress: "default",
      done: "outline"
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const filteredIssues = issues.filter(issue => issue.project === selectedProject);
  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <Card className="h-96" data-testid="linear-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <Bug className="text-white h-4 w-4" />
          </div>
          Linear Project Tracker
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="issues" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="create">Create Issue</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="issues" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: project.color }}></div>
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline">{filteredIssues.length} issues</Badge>
              </div>
              {currentProject && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{currentProject.progress}%</span>
                  </div>
                  <Progress value={currentProject.progress} className="h-2" />
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    data-testid={`issue-${issue.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(issue.status)}
                        <span className="font-medium text-sm">{issue.id}</span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`}></div>
                      </div>
                      <Badge variant={getStatusBadge(issue.status) as any}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2">{issue.title}</h4>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={issue.assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {issue.assignee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {issue.assignee.name}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{issue.created}</span>
                    </div>

                    {issue.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {issue.labels.map((label) => (
                          <Badge key={label} variant="outline" className="text-xs h-5">
                            <Tag className="h-2 w-2 mr-1" />
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => {
                          const nextStatus = issue.status === 'todo' ? 'in_progress' : 
                                           issue.status === 'in_progress' ? 'done' : 'todo';
                          updateIssue.mutate({ id: issue.id, updates: { status: nextStatus } });
                        }}
                        disabled={updateIssue.isPending}
                        data-testid={`update-issue-${issue.id}`}
                      >
                        {issue.status === 'todo' ? 'Start' : 
                         issue.status === 'in_progress' ? 'Complete' : 'Reopen'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        data-testid={`assign-issue-${issue.id}`}
                      >
                        <User className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="projects" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => setSelectedProject(project.id)}
                    data-testid={`project-${project.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: project.color }}></div>
                        <h4 className="font-medium text-sm">{project.name}</h4>
                      </div>
                      <Badge variant="outline">{project.issues} issues</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-4 py-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: project.color }}></div>
                            {project.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    data-testid="issue-title-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select value={newIssue.priority} onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={newIssue.status} onValueChange={(value) => setNewIssue({ ...newIssue, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Textarea
                    placeholder="Detailed description of the issue, including reproduction steps"
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    className="resize-none min-h-[100px]"
                    data-testid="issue-description-input"
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button 
                className="w-full" 
                onClick={handleCreateIssue}
                disabled={createIssue.isPending}
                data-testid="submit-issue-button"
              >
                {createIssue.isPending ? "Creating..." : "Create Issue"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}