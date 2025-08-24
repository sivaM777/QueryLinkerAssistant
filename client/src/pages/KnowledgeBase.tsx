import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Plus, BookOpen, Star, Eye, ExternalLink, Filter, Bookmark } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function KnowledgeBase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSolution, setNewSolution] = useState({
    title: "",
    content: "",
    tags: "",
    systemId: "none",
  });


  const { data: solutions, isLoading: solutionsLoading } = useQuery({
    queryKey: ["/api/solutions"],
    
  });

  const { data: popularSolutions } = useQuery({
    queryKey: ["/api/analytics/popular-solutions"],
    
  });

  const { data: systems } = useQuery({
    queryKey: ["/api/systems"],
    
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search", { query });
      return response.json();
    },
  });

  const addSolutionMutation = useMutation({
    mutationFn: async (solutionData: any) => {
      await apiRequest("POST", "/api/solutions", solutionData);
    },
    onSuccess: () => {
      toast({
        title: "Solution Created",
        description: "New solution added to knowledge base",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/solutions"] });
      setShowAddDialog(false);
      setNewSolution({ title: "", content: "", tags: "", systemId: "none" });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Solution",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock solutions data
  const mockSolutions = [
    {
      id: 1,
      title: "Database Connection Timeout Resolution",
      content: "This guide helps resolve database connection timeout issues commonly encountered in production environments...",
      tags: ["database", "timeout", "production"],
      systemId: 1,
      system: { name: "Jira", type: "jira" },
      url: "https://example.com/solution/1",
      metadata: { views: 245, ratings: 4.8, lastUpdated: "2024-01-15" },
      status: "active",
    },
    {
      id: 2,
      title: "SSL Certificate Installation Guide",
      content: "Step-by-step instructions for installing and configuring SSL certificates on various server environments...",
      tags: ["ssl", "security", "certificates"],
      systemId: 2,
      system: { name: "Confluence", type: "confluence" },
      url: "https://example.com/solution/2",
      metadata: { views: 189, ratings: 4.6, lastUpdated: "2024-01-10" },
      status: "active",
    },
    {
      id: 3,
      title: "Memory Leak Debugging in Java Applications",
      content: "Comprehensive guide for identifying and fixing memory leaks in Java applications using various tools...",
      tags: ["java", "memory", "debugging", "performance"],
      systemId: 3,
      system: { name: "GitHub", type: "github" },
      url: "https://example.com/solution/3",
      metadata: { views: 156, ratings: 4.9, lastUpdated: "2024-01-12" },
      status: "active",
    },
    {
      id: 4,
      title: "Network Latency Troubleshooting",
      content: "Tools and techniques for diagnosing and resolving network latency issues in distributed systems...",
      tags: ["network", "latency", "troubleshooting"],
      systemId: 4,
      system: { name: "ServiceNow", type: "servicenow" },
      url: "https://example.com/solution/4",
      metadata: { views: 203, ratings: 4.5, lastUpdated: "2024-01-08" },
      status: "active",
    },
  ];

  const categories = [
    { value: "all", label: "All Categories", count: mockSolutions.length },
    { value: "database", label: "Database", count: 1 },
    { value: "security", label: "Security", count: 1 },
    { value: "performance", label: "Performance", count: 2 },
    { value: "network", label: "Network", count: 1 },
  ];

  const handleSearch = (query: string) => {
    if (query.trim()) {
      searchMutation.mutate(query);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleAddSolution = () => {
    if (!newSolution.title || !newSolution.content) return;

    addSolutionMutation.mutate({
      title: newSolution.title,
      content: newSolution.content,
      tags: newSolution.tags.split(",").map(tag => tag.trim()),
      systemId: newSolution.systemId === "none" ? null : parseInt(newSolution.systemId) || null,
      status: "active",
    });
  };

  const filteredSolutions = mockSolutions.filter(solution => {
    if (selectedCategory === "all") return true;
    return solution.tags.includes(selectedCategory);
  });


  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="knowledge-base-page">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
            <p className="text-gray-500 dark:text-slate-400">Search and manage solution documentation</p>
          </div>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-solution-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Solution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="add-solution-dialog">
            <DialogHeader>
              <DialogTitle>Add New Solution</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create a new solution to help others solve similar problems.
              </p>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="solution-title">Title</Label>
                <Input
                  id="solution-title"
                  value={newSolution.title}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief, descriptive title for the solution"
                />
              </div>
              
              <div>
                <Label htmlFor="solution-content">Content</Label>
                <Textarea
                  id="solution-content"
                  value={newSolution.content}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detailed solution steps and explanation..."
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="solution-tags">Tags (comma-separated)</Label>
                <Input
                  id="solution-tags"
                  value={newSolution.tags}
                  onChange={(e) => setNewSolution(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="database, timeout, production"
                />
              </div>
              
              <div>
                <Label htmlFor="solution-system">System (Optional)</Label>
                <Select value={newSolution.systemId} onValueChange={(value) => setNewSolution(prev => ({ ...prev, systemId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select related system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No system</SelectItem>
                    <SelectItem value="1">Jira</SelectItem>
                    <SelectItem value="2">Confluence</SelectItem>
                    <SelectItem value="3">GitHub</SelectItem>
                    <SelectItem value="4">ServiceNow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSolution}
                  disabled={!newSolution.title || !newSolution.content || addSolutionMutation.isPending}
                  data-testid="confirm-add-solution"
                >
                  {addSolutionMutation.isPending ? "Creating..." : "Create Solution"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card data-testid="search-and-filters">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Input
                  type="text"
                  placeholder="Search solutions, knowledge articles, and documentation..."
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="knowledge-search-input"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </form>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Solutions</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Solutions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {solutionsLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <CardContent className="p-0 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredSolutions.map((solution, index) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                    data-testid={`solution-card-${solution.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {solution.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-3 mb-3">
                            {solution.content}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {solution.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {solution.metadata.views} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {solution.metadata.ratings}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {solution.system.name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Updated {solution.metadata.lastUpdated}
                        </span>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Solutions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Solutions with the highest engagement and ratings
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSolutions
                  .sort((a, b) => b.metadata.views - a.metadata.views)
                  .map((solution, index) => (
                    <motion.div
                      key={solution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      data-testid={`popular-solution-${index}`}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{solution.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                          <span>{solution.metadata.views} views</span>
                          <span>⭐ {solution.metadata.ratings}</span>
                          <Badge variant="outline" className="text-xs">
                            {solution.system.name}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recently Updated Solutions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest updates and new solutions added to the knowledge base
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSolutions
                  .sort((a, b) => new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime())
                  .map((solution, index) => (
                    <motion.div
                      key={solution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      data-testid={`recent-solution-${index}`}
                    >
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{solution.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                          <span>Updated {solution.metadata.lastUpdated}</span>
                          <Badge variant="outline" className="text-xs">
                            {solution.system.name}
                          </Badge>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Results */}
      {searchMutation.data && (
        <Card data-testid="search-results">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Found {searchMutation.data.resultsCount} results for "{searchMutation.data.query}"
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchMutation.data.results.map((result: any, index: number) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  data-testid={`search-result-${index}`}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{result.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 line-clamp-2">
                    {result.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.system?.name || "Unknown"}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
