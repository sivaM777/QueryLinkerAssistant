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
import { MessageSquare, Plus, User, Clock, Star, Send, Tag } from "lucide-react";

export default function ZendeskPanel() {
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "normal", type: "question" });
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newReply, setNewReply] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real Zendesk API calls
  const tickets = [
    {
      id: "12345",
      subject: "Login issues with mobile app",
      status: "open",
      priority: "high",
      type: "problem",
      requester: { name: "John Smith", email: "john.smith@company.com", avatar: "" },
      assignee: { name: "Support Agent", avatar: "" },
      created: "2 hours ago",
      updated: "30 minutes ago",
      tags: ["mobile", "authentication"],
      description: "I'm unable to log into the mobile app. Getting 'Invalid credentials' error even with correct password."
    },
    {
      id: "12346",
      subject: "Feature request: Dark mode",
      status: "pending",
      priority: "low",
      type: "feature_request",
      requester: { name: "Sarah Johnson", email: "sarah.j@email.com", avatar: "" },
      assignee: { name: "Product Team", avatar: "" },
      created: "1 day ago",
      updated: "6 hours ago",
      tags: ["feature", "ui"],
      description: "Would love to see a dark mode option in the app settings."
    },
    {
      id: "12347",
      subject: "Billing inquiry",
      status: "solved",
      priority: "normal",
      type: "question",
      requester: { name: "Mike Wilson", email: "mike.w@business.com", avatar: "" },
      assignee: { name: "Billing Team", avatar: "" },
      created: "3 days ago",
      updated: "2 days ago",
      tags: ["billing", "subscription"],
      description: "Question about my recent invoice charges."
    },
  ];

  const createTicket = useMutation({
    mutationFn: async (ticketData: any) => {
      // Replace with actual Zendesk API call
      await apiRequest("/api/integrations/zendesk/tickets", { method: "POST", body: JSON.stringify(ticketData) });
    },
    onSuccess: () => {
      setNewTicket({ subject: "", description: "", priority: "normal", type: "question" });
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/zendesk/tickets"] });
    },
    onError: () => {
      toast({
        title: "Failed to Create Ticket",
        description: "Could not create support ticket",
        variant: "destructive",
      });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Replace with actual Zendesk API call
      await apiRequest(`/api/integrations/zendesk/tickets/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "Ticket has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/zendesk/tickets"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update ticket",
        variant: "destructive",
      });
    },
  });

  const addReply = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      // Replace with actual Zendesk API call
      await apiRequest(`/api/integrations/zendesk/tickets/${ticketId}/comments`, { method: "POST", body: JSON.stringify({ message }) });
    },
    onSuccess: () => {
      setNewReply("");
      toast({
        title: "Reply Added",
        description: "Your reply has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Reply",
        description: "Could not add reply to ticket",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in subject and description",
        variant: "destructive",
      });
      return;
    }
    createTicket.mutate(newTicket);
  };

  const handleAddReply = () => {
    if (!newReply.trim() || !selectedTicket) return;
    addReply.mutate({ ticketId: selectedTicket, message: newReply });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      pending: "default",
      solved: "secondary",
      closed: "outline"
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return "🔴";
      case "high": return "🟠";
      case "normal": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  return (
    <Card className="h-96" data-testid="zendesk-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
            <MessageSquare className="text-white h-4 w-4" />
          </div>
          Zendesk Support
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="tickets" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
              <TabsTrigger value="create">Create Ticket</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tickets" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                      selectedTicket === ticket.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    data-testid={`ticket-${ticket.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPriorityIcon(ticket.priority)}</span>
                        <span className="font-medium text-sm">#{ticket.id}</span>
                      </div>
                      <Badge variant={getStatusBadge(ticket.status) as any}>
                        {ticket.status}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2">{ticket.subject}</h4>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={ticket.requester.avatar} />
                        <AvatarFallback className="text-xs">
                          {ticket.requester.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {ticket.requester.name}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{ticket.created}</span>
                    </div>

                    {ticket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {ticket.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs h-5">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {selectedTicket === ticket.id && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {ticket.description}
                        </p>
                        
                        <div className="flex gap-2 mb-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTicket.mutate({ 
                                id: ticket.id, 
                                updates: { status: ticket.status === 'open' ? 'solved' : 'open' }
                              });
                            }}
                            disabled={updateTicket.isPending}
                            data-testid={`toggle-status-${ticket.id}`}
                          >
                            {ticket.status === 'open' ? 'Mark Solved' : 'Reopen'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            data-testid={`escalate-${ticket.id}`}
                          >
                            Escalate
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add a reply..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            className="resize-none min-h-[60px] text-sm"
                            data-testid={`reply-input-${ticket.id}`}
                          />
                          <div className="flex justify-end">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReply();
                              }}
                              disabled={!newReply.trim() || addReply.isPending}
                              data-testid={`send-reply-${ticket.id}`}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-4 py-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject *</label>
                  <Input
                    placeholder="Brief summary of your issue"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    data-testid="ticket-subject-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <Select value={newTicket.type} onValueChange={(value) => setNewTicket({ ...newTicket, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question">Question</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="problem">Problem</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Description *</label>
                  <Textarea
                    placeholder="Detailed description of your issue or request"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="resize-none min-h-[120px]"
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
                data-testid="submit-support-ticket-button"
              >
                {createTicket.isPending ? "Creating..." : "Create Support Ticket"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}