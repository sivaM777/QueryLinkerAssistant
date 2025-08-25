import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Database, Calendar, Users, ExternalLink, Edit, Search } from "lucide-react";

export default function NotionPanel() {
  const [newPage, setNewPage] = useState({ title: "", content: "", type: "page", database: "" });
  const [selectedDatabase, setSelectedDatabase] = useState("tasks");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real Notion API calls
  const recentPages = [
    {
      id: "page-1",
      title: "Project Planning Guide",
      type: "page",
      lastEdited: "2 hours ago",
      database: null,
      icon: "📋",
      url: "https://notion.so/project-planning-guide"
    },
    {
      id: "page-2",
      title: "Meeting Notes - Sprint Review",
      type: "page",
      lastEdited: "5 hours ago",
      database: null,
      icon: "📝",
      url: "https://notion.so/sprint-review-notes"
    },
    {
      id: "page-3",
      title: "API Documentation",
      type: "page",
      lastEdited: "1 day ago",
      database: null,
      icon: "🔗",
      url: "https://notion.so/api-documentation"
    },
  ];

  const databases = [
    {
      id: "tasks",
      name: "Tasks Database",
      description: "Track project tasks and assignments",
      records: 24,
      lastUpdated: "1 hour ago",
      icon: "✅"
    },
    {
      id: "knowledge",
      name: "Knowledge Base",
      description: "Company documentation and processes",
      records: 156,
      lastUpdated: "3 hours ago",
      icon: "📚"
    },
    {
      id: "meetings",
      name: "Meeting Notes",
      description: "All team meeting notes and action items",
      records: 48,
      lastUpdated: "2 days ago",
      icon: "🗓️"
    },
  ];

  const databaseRecords = [
    {
      id: "task-1",
      title: "Implement user authentication",
      status: "In Progress",
      assignee: "John Doe",
      priority: "High",
      dueDate: "2025-08-28"
    },
    {
      id: "task-2",
      title: "Design landing page",
      status: "Complete",
      assignee: "Sarah Smith",
      priority: "Medium",
      dueDate: "2025-08-25"
    },
    {
      id: "task-3",
      title: "Set up CI/CD pipeline",
      status: "Todo",
      assignee: "Mike Johnson",
      priority: "Low",
      dueDate: "2025-08-30"
    },
  ];

  const createPage = useMutation({
    mutationFn: async (pageData: any) => {
      // Replace with actual Notion API call
      await apiRequest("/api/integrations/notion/pages", { method: "POST", body: JSON.stringify(pageData) });
    },
    onSuccess: () => {
      setNewPage({ title: "", content: "", type: "page", database: "" });
      toast({
        title: "Page Created",
        description: "Your Notion page has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/notion/pages"] });
    },
    onError: () => {
      toast({
        title: "Failed to Create Page",
        description: "Could not create Notion page",
        variant: "destructive",
      });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Replace with actual Notion API call
      await apiRequest(`/api/integrations/notion/records/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onSuccess: () => {
      toast({
        title: "Record Updated",
        description: "Database record has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/notion/records"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update record",
        variant: "destructive",
      });
    },
  });

  const handleCreatePage = () => {
    if (!newPage.title) {
      toast({
        title: "Title Required",
        description: "Please enter a page title",
        variant: "destructive",
      });
      return;
    }
    createPage.mutate(newPage);
  };

  const openInNotion = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "Todo": "secondary",
      "In Progress": "default",
      "Complete": "outline"
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const currentDatabase = databases.find(db => db.id === selectedDatabase);

  return (
    <Card className="h-96" data-testid="notion-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-800 dark:bg-gray-200 rounded flex items-center justify-center">
            <FileText className="text-white dark:text-black h-4 w-4" />
          </div>
          Notion Workspace
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="recent" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="databases">Databases</TabsTrigger>
              <TabsTrigger value="create">Create</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search pages and databases..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                  data-testid="notion-search-input"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {recentPages
                  .filter(page => page.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((page) => (
                  <div
                    key={page.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    onClick={() => openInNotion(page.url)}
                    data-testid={`page-${page.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{page.icon}</span>
                        <h4 className="font-medium text-sm">{page.title}</h4>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Page</span>
                      <span>Edited {page.lastEdited}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => openInNotion("https://notion.so")}
                data-testid="open-notion-button"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Notion
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="databases" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      <div className="flex items-center gap-2">
                        <span>{db.icon}</span>
                        {db.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {currentDatabase && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{currentDatabase.icon}</span>
                      <h4 className="font-medium text-sm">{currentDatabase.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {currentDatabase.description}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{currentDatabase.records} records</span>
                      <span>Updated {currentDatabase.lastUpdated}</span>
                    </div>
                  </div>
                )}

                {selectedDatabase === "tasks" && databaseRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                    data-testid={`record-${record.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{record.title}</h4>
                      <Badge variant={getStatusBadge(record.status) as any}>
                        {record.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Assignee:</span>
                        <br />
                        {record.assignee}
                      </div>
                      <div>
                        <span className="font-medium">Due:</span>
                        <br />
                        {new Date(record.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => {
                          const nextStatus = record.status === 'Todo' ? 'In Progress' : 
                                           record.status === 'In Progress' ? 'Complete' : 'Todo';
                          updateRecord.mutate({ id: record.id, updates: { status: nextStatus } });
                        }}
                        disabled={updateRecord.isPending}
                        data-testid={`update-record-${record.id}`}
                      >
                        {record.status === 'Todo' ? 'Start' : 
                         record.status === 'In Progress' ? 'Complete' : 'Reopen'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        data-testid={`edit-record-${record.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
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
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Select value={newPage.type} onValueChange={(value) => setNewPage({ ...newPage, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Page
                        </div>
                      </SelectItem>
                      <SelectItem value="database">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Database Record
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newPage.type === "database" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Database</label>
                    <Select value={newPage.database} onValueChange={(value) => setNewPage({ ...newPage, database: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        {databases.map((db) => (
                          <SelectItem key={db.id} value={db.id}>
                            <div className="flex items-center gap-2">
                              <span>{db.icon}</span>
                              {db.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    placeholder={newPage.type === "page" ? "Page title" : "Record title"}
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    data-testid="notion-title-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Content</label>
                  <Textarea
                    placeholder={newPage.type === "page" ? "Page content..." : "Record details..."}
                    value={newPage.content}
                    onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                    className="resize-none min-h-[120px]"
                    data-testid="notion-content-input"
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button 
                className="w-full" 
                onClick={handleCreatePage}
                disabled={createPage.isPending}
                data-testid="create-notion-page-button"
              >
                {createPage.isPending ? "Creating..." : `Create ${newPage.type === 'page' ? 'Page' : 'Record'}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}