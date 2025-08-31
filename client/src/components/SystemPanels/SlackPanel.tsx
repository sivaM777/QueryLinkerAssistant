import { useState, useEffect } from "react";
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
import { Send, Hash, Users, Plus, Bell, Search, AlertCircle, CheckCircle, Settings, ExternalLink } from "lucide-react";

interface SlackChannel {
  id: string;
  name: string;
  purpose?: string;
  topic?: string;
  isChannel: boolean;
  isMember: boolean;
  memberCount?: number;
}

interface SlackMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  channel: string;
  userInfo?: {
    name: string;
    realName: string;
    image: string;
  };
}

interface SlackWorkspace {
  teamName: string;
  teamId: string;
}

interface SlackStatus {
  connected: boolean;
  workspace: SlackWorkspace | null;
}

export default function SlackPanel() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [channelSearch, setChannelSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Slack connection status
  const { data: slackStatus, isLoading: statusLoading } = useQuery<SlackStatus>({
    queryKey: ['/api/integrations/slack/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/slack/status');
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch Slack channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<SlackChannel[]>({
    queryKey: ['/api/integrations/slack/channels'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/slack/channels');
      if (!response.ok) throw new Error('Failed to fetch channels');
      return await response.json();
    },
    enabled: slackStatus?.connected === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch messages for selected channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<SlackMessage[]>({
    queryKey: ['/api/integrations/slack/messages', selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const response = await apiRequest(`/api/integrations/slack/messages/${selectedChannel}?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    },
    enabled: !!selectedChannel && slackStatus?.connected === true,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch direct messages
  const { data: directMessages = [], isLoading: dmsLoading } = useQuery({
    queryKey: ['/api/integrations/slack/direct-messages'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/slack/direct-messages');
      if (!response.ok) throw new Error('Failed to fetch direct messages');
      return await response.json();
    },
    enabled: slackStatus?.connected === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ channel, text }: { channel: string; text: string }) => {
      const response = await apiRequest("/api/integrations/slack/message", { 
        method: "POST", 
        body: { channel, text } 
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been posted to Slack",
      });
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/slack/messages', selectedChannel] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send message to Slack",
        variant: "destructive",
      });
    },
  });

  // Connect to Slack
  const connectToSlack = () => {
    window.open('/api/auth/slack/login', '_blank', 'width=600,height=700');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return;
    sendMessage.mutate({ channel: selectedChannel, text: newMessage });
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  // If not connected, show connection interface
  if (!statusLoading && !slackStatus?.connected) {
    return (
      <Card className="h-96" data-testid="slack-panel">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            Slack Integration
            <Badge variant="secondary" className="ml-auto flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Not Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Connect to Slack</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Connect your Slack workspace to enable real-time messaging, notifications, 
              and seamless team collaboration within QueryLinker.
            </p>
          </div>
          <Button 
            onClick={connectToSlack}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Connect Slack Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96" data-testid="slack-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          Slack Integration
          <Badge variant="default" className="ml-auto flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            {slackStatus?.workspace?.teamName || 'Connected'}
          </Badge>
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
                <Input 
                  placeholder="Search channels..." 
                  className="h-8 text-sm"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                />
              </div>
              {channelsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {filteredChannels.map((channel) => (
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
                      {channel.memberCount && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {channel.memberCount}
                        </Badge>
                      )}
                    </Button>
                  ))}
                  {filteredChannels.length === 0 && (
                    <p className="text-sm text-gray-500">No channels found</p>
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 px-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-3 py-3">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.userInfo?.image} />
                        <AvatarFallback className="text-xs">
                          {message.userInfo?.name?.charAt(0) || message.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.userInfo?.realName || message.userInfo?.name || message.user}
                          </span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 break-words">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages in this channel yet</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name || 'channel'}...`}
                  className="min-h-[40px] max-h-[80px] resize-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dms" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              {dmsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  {directMessages.map((dm: any) => (
                    <div key={dm.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={dm.userImage} />
                        <AvatarFallback className="text-xs">
                          {dm.userName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{dm.userName}</span>
                          {dm.unread > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {dm.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{dm.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                  {directMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No direct messages</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}