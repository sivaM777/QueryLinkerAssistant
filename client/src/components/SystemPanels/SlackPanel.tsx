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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Hash, Users, Plus, Bell, Search } from "lucide-react";

export default function SlackPanel() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real Slack API calls
  const channels = [
    { id: "general", name: "general", members: 12, unread: 0 },
    { id: "dev", name: "development", members: 8, unread: 3 },
    { id: "support", name: "support", members: 15, unread: 1 },
  ];

  const messages = [
    {
      id: 1,
      user: "John Doe",
      avatar: "",
      message: "The new deployment is ready for testing",
      timestamp: "2:30 PM",
      channel: "general"
    },
    {
      id: 2,
      user: "Sarah Wilson",
      avatar: "",
      message: "I've fixed the authentication issue. Please review the PR.",
      timestamp: "2:25 PM",
      channel: "dev"
    },
    {
      id: 3,
      user: "Mike Johnson",
      avatar: "",
      message: "Customer reported a bug in the checkout process",
      timestamp: "2:15 PM",
      channel: "support"
    },
  ];

  const directMessages = [
    { id: 1, user: "Alice Smith", avatar: "", lastMessage: "Thanks for the help!", unread: 0 },
    { id: 2, user: "Bob Chen", avatar: "", lastMessage: "Meeting at 3 PM?", unread: 2 },
    { id: 3, user: "Carol Davis", avatar: "", lastMessage: "Code review completed", unread: 0 },
  ];

  const sendMessage = useMutation({
    mutationFn: async ({ channel, message }: { channel: string; message: string }) => {
      // Replace with actual Slack API call
      await apiRequest("/api/integrations/slack/message", { method: "POST", body: JSON.stringify({ channel, message }) });
    },
    onSuccess: () => {
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been posted to Slack",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/slack/messages"] });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send message to Slack",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ channel: selectedChannel, message: newMessage });
  };

  return (
    <Card className="h-96" data-testid="slack-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          Slack Integration
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="channels" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="dms">Direct Messages</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="channels" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input placeholder="Search channels..." className="h-8 text-sm" />
              </div>
              <div className="flex flex-wrap gap-1">
                {channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannel === channel.id ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedChannel(channel.id)}
                    data-testid={`channel-${channel.id}`}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {channel.name}
                    {channel.unread > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {channel.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {messages
                  .filter(msg => msg.channel === selectedChannel)
                  .map((message) => (
                  <div key={message.id} className="flex items-start gap-2" data-testid={`message-${message.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.avatar} />
                      <AvatarFallback className="text-xs">
                        {message.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.user}</span>
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder={`Message #${selectedChannel}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none min-h-[60px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="message-input"
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  data-testid="send-message-button"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dms" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 py-3">
                {directMessages.map((dm) => (
                  <div
                    key={dm.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer"
                    data-testid={`dm-${dm.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={dm.avatar} />
                      <AvatarFallback className="text-xs">
                        {dm.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{dm.user}</span>
                        {dm.unread > 0 && (
                          <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">
                            {dm.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{dm.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button variant="outline" size="sm" className="w-full" data-testid="new-dm-button">
                <Plus className="h-4 w-4 mr-2" />
                New Direct Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}