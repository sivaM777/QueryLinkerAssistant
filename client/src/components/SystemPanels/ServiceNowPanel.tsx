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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Plus, AlertTriangle, Clock, CheckCircle, ArrowUp, Filter } from "lucide-react";

export default function ServiceNowPanel() {
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "", category: "" });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real ServiceNow API calls
  const tickets = [
    {
      id: "INC001234",
      title: "Email server not responding",
      status: "Open",
      priority: "High",
      category: "Infrastructure",
      assignee: "IT Support Team",
      created: "2 hours ago",
      description: "Users unable to access email. Server appears to be down."
    },
    {
      id: "INC001235",
      title: "VPN connection issues",
      status: "In Progress",
      priority: "Medium",
      category: "Network",
      assignee: "Network Team",
      created: "5 hours ago",
      description: "Multiple users reporting VPN connectivity problems."
    },
    {
      id: "INC001236",
      title: "Software license renewal",
      status: "Resolved",
      priority: "Low",
      category: "Licensing",
      assignee: "Procurement",
      created: "1 day ago",
      description: "Annual software license needs renewal."
    },
  ];

  const categories = [
    "Infrastructure", "Network", "Software", "Hardware", "Security", "Licensing"
  ];

  const priorities = ["Low", "Medium", "High", "Critical"];

  const createTicket = useMutation({
    mutationFn: async (ticketData: any) => {
      // Replace with actual ServiceNow API call
      await apiRequest("/api/integrations/servicenow/tickets", { method: "POST", body: JSON.stringify(ticketData) });
    },
    onSuccess: () => {
      setNewTicket({ title: "", description: "", priority: "", category: "" });
      setShowCreateDialog(false);
      toast({
        title: "Ticket Created",
        description: "Your ServiceNow ticket has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/servicenow/tickets"] });
    },
    onError: () => {
      toast({
        title: "Failed to Create Ticket",
        description: "Could not create ServiceNow ticket",
        variant: "destructive",
      });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Replace with actual ServiceNow API call
      await apiRequest(`/api/integrations/servicenow/tickets/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Ticket has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/servicenow/tickets"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update ticket",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.description || !newTicket.priority || !newTicket.category) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createTicket.mutate(newTicket);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "In Progress": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Resolved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "bg-red-500";
      case "High": return "bg-orange-500";
      case "Medium": return "bg-yellow-500";
      case "Low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const filteredTickets = filterStatus === "all" 
    ? tickets 
    : tickets.filter(ticket => ticket.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <Card className="h-96" data-testid="servicenow-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
            <Ticket className="text-white h-4 w-4" />
          </div>
          ServiceNow ITSM
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="tickets" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
              <TabsTrigger value="create">Create Ticket</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tickets" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="ml-auto" data-testid="create-ticket-button">
                      <Plus className="h-4 w-4 mr-1" />
                      New Ticket
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                    data-testid={`ticket-${ticket.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-medium text-sm">{ticket.id}</span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`}></div>
                      </div>
                      <Badge variant={ticket.status === "Open" ? "destructive" : 
                                    ticket.status === "In Progress" ? "default" : "secondary"}>
                        {ticket.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{ticket.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{ticket.category} • {ticket.priority} Priority</span>
                      <span>{ticket.created}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-xs"
                        onClick={() => updateTicket.mutate({ 
                          id: ticket.id, 
                          updates: { status: "In Progress" } 
                        })}
                        disabled={ticket.status === "Resolved" || updateTicket.isPending}
                        data-testid={`update-ticket-${ticket.id}`}
                      >
                        Update
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs"
                        data-testid={`escalate-ticket-${ticket.id}`}
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Escalate
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
                  <label className="text-sm font-medium mb-1 block">Title *</label>
                  <Input
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    data-testid="ticket-title-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority *</label>
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category *</label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Textarea
                    placeholder="Detailed description of the issue, including steps to reproduce and impact"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="resize-none min-h-[100px]"
                    data-testid="ticket-description-input"
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button 
                className="w-full" 
                onClick={handleCreateTicket}
                disabled={createTicket.isPending}
                data-testid="submit-ticket-button"
              >
                {createTicket.isPending ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent data-testid="create-ticket-dialog">
            <DialogHeader>
              <DialogTitle>Create ServiceNow Ticket</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-gray-600">
              Use the Create Ticket tab above to submit a new IT service request.
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}