import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Bot,
  Plus,
  Settings,
  Play,
  Code,
  Users,
  Clock,
  Zap,
  ArrowRight,
  Command,
  Hash,
  Send
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface SlashCommand {
  id: string;
  name: string;
  description: string;
  usage: string;
  response_type: 'ephemeral' | 'in_channel';
  enabled: boolean;
  usage_count: number;
  last_used?: string;
}

export default function SlackCommands() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("/mycommand");
  const [newDesc, setNewDesc] = useState("");
  const [newUsage, setNewUsage] = useState("/mycommand [parameters]");
  const [newRespType, setNewRespType] = useState<"ephemeral" | "in_channel">("ephemeral");
  const [newTemplate, setNewTemplate] = useState("");

  // Mock data for demonstration
  const commands: SlashCommand[] = [
    {
      id: "incident-create",
      name: "/incident",
      description: "Create a new incident ticket",
      usage: "/incident [title] [severity]",
      response_type: "ephemeral",
      enabled: true,
      usage_count: 45,
      last_used: "2024-01-15T10:30:00Z"
    },
    {
      id: "status-check",
      name: "/status",
      description: "Check system status and health",
      usage: "/status [system]",
      response_type: "in_channel",
      enabled: true,
      usage_count: 128,
      last_used: "2024-01-15T11:45:00Z"
    },
    {
      id: "sla-report",
      name: "/sla",
      description: "Generate SLA compliance report",
      usage: "/sla [time_period]",
      response_type: "ephemeral",
      enabled: true,
      usage_count: 23,
      last_used: "2024-01-14T16:20:00Z"
    },
    {
      id: "help-desk",
      name: "/help",
      description: "Get help and documentation",
      usage: "/help [topic]",
      response_type: "ephemeral",
      enabled: true,
      usage_count: 67,
      last_used: "2024-01-15T09:15:00Z"
    }
  ];

  const testCommandMutation = useMutation({
    mutationFn: async (commandName: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, response: `Test response for ${commandName}` };
    },
    onSuccess: (data, commandName) => {
      toast({
        title: "Command Test Successful",
        description: `${commandName} executed successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Command Test Failed",
        description: "Failed to execute command",
        variant: "destructive",
      });
    },
  });

  const createCommandMutation = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 600));
      return true;
    },
    onSuccess: () => {
      toast({ title: "Command Created", description: `${newName} has been created.` });
      setIsCreating(false);
      setNewName("/mycommand");
      setNewDesc("");
      setNewUsage("/mycommand [parameters]");
      setNewRespType("ephemeral");
      setNewTemplate("");
    },
    onError: () => {
      toast({ title: "Create Failed", description: "Unable to create command", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen space-y-6 animate-fadeIn p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 lg:px-6 py-4 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
              Slack Commands
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Manage custom slash commands and bot interactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Command
            </Button>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Bot className="h-3 w-3 mr-1" />
              4 Active Commands
            </Badge>
          </div>
        </div>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Slack Command</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Command Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Usage</label>
              <Input value={newUsage} onChange={(e) => setNewUsage(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Response Type</label>
              <Select value={newRespType} onValueChange={(v) => setNewRespType(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select response type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ephemeral">Ephemeral (private)</SelectItem>
                  <SelectItem value="in_channel">In Channel (public)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Response Template</label>
              <Textarea rows={4} value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => createCommandMutation.mutate()} disabled={createCommandMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {createCommandMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Commands</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Command className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Zap className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">All active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Usage</p>
                <p className="text-2xl font-bold text-blue-600">263</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowRight className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-gray-500 dark:text-slate-400">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Most Used</p>
                <p className="text-2xl font-bold text-orange-600">/status</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Hash className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-500 dark:text-slate-400">128 uses</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Response Time</p>
                <p className="text-2xl font-bold text-green-600">0.8s</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-gray-500 dark:text-slate-400">Average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commands List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Available Commands</span>
                <Badge variant="outline">{commands.length} commands</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {commands.map((command, index) => (
                  <motion.div
                    key={command.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCommand(command.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Command className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <code className="text-sm font-mono bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {command.name}
                            </code>
                            <Badge className={command.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {command.enabled ? "Active" : "Disabled"}
                            </Badge>
                            <Badge variant="outline">
                              {command.response_type}
                            </Badge>
                          </div>
                          <p className="text-gray-900 dark:text-white font-medium mb-1">
                            {command.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-slate-400">
                            <span>Usage: <code className="text-xs">{command.usage}</code></span>
                            <span>{command.usage_count} uses</span>
                            {command.last_used && (
                              <span>Last used: {new Date(command.last_used).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            testCommandMutation.mutate(command.name);
                          }}
                          disabled={testCommandMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast({
                              title: "Settings",
                              description: `${command.name} settings will be available in a future update`,
                            });
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Command Details / Create Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Command Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCommand ? (
                <>
                  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-medium mb-2">Quick Test</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Test this command with sample parameters
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => testCommandMutation.mutate('/status')}
                      disabled={testCommandMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {testCommandMutation.isPending ? "Testing..." : "Run Test"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Command Info</h4>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Usage Count:</span>
                        <span className="ml-2">128 times</span>
                      </div>
                      <div>
                        <span className="font-medium">Last Used:</span>
                        <span className="ml-2">Today, 11:45 AM</span>
                      </div>
                      <div>
                        <span className="font-medium">Success Rate:</span>
                        <span className="ml-2 text-green-600">98.4%</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Command className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">
                    Select a command to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
