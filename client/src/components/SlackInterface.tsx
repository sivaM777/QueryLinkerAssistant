import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Hash, 
  Users, 
  Search, 
  MessageSquare, 
  Settings, 
  ExternalLink,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";

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

interface DirectMessage {
  id: string;
  user: string;
  userName: string;
  userImage: string;
  lastMessage: string;
  unread: number;
}

export default function SlackInterface() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedDM, setSelectedDM] = useState<string>("");
  const [channelSearch, setChannelSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'channels' | 'dms' | 'search' | 'real-time'>('channels');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check Slack connection status
  const { data: slackStatus, isLoading: statusLoading } = useQuery<SlackStatus>({
    queryKey: ['/api/integrations/slack/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/slack/status');
      return await response.json();
    },
    refetchInterval: 30000,
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
    staleTime: 5 * 60 * 1000,
  });

  // Fetch messages for selected channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<SlackMessage[]>({
    queryKey: ['/api/integrations/slack/messages', selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return [];
      const response = await apiRequest(`/api/integrations/slack/messages/${selectedChannel}?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    },
    enabled: !!selectedChannel && slackStatus?.connected === true,
    refetchInterval: 5000,
  });

  // Fetch direct messages
  const { data: directMessages = [], isLoading: dmsLoading } = useQuery<DirectMessage[]>({
    queryKey: ['/api/integrations/slack/direct-messages'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations/slack/direct-messages');
      if (!response.ok) throw new Error('Failed to fetch direct messages');
      return await response.json();
    },
    enabled: slackStatus?.connected === true,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel && activeTab === 'channels') {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel, activeTab]);

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

  const connectToSlack = () => {
    window.open('/api/auth/slack/login', '_blank', 'width=600,height=700');
  };

  const handleSendMessage = () => {
    const targetChannel = selectedChannel || selectedDM;
    if (!newMessage.trim() || !targetChannel) return;
    sendMessage.mutate({ channel: targetChannel, text: newMessage });
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const getCurrentChannelName = () => {
    if (selectedChannel) {
      const channel = channels.find(c => c.id === selectedChannel);
      return channel?.name || 'Unknown Channel';
    }
    if (selectedDM) {
      const dm = directMessages.find(d => d.id === selectedDM);
      return dm?.userName || 'Unknown User';
    }
    return 'Select a channel';
  };

  // If not connected, show connection interface
  if (!statusLoading && !slackStatus?.connected) {
    return (
      <div className="flex h-full bg-gray-900 text-white">
        <div className="flex flex-col items-center justify-center w-full p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect to Slack</h2>
              <p className="text-gray-400 mb-6">
                Connect your Slack workspace to enable real-time messaging, notifications, 
                and seamless team collaboration within QueryLinker.
              </p>
            </div>
            <Button 
              onClick={connectToSlack}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Slack Workspace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-900 text-white" data-testid="slack-interface">
      {/* Left Sidebar - Quick Actions */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-1">Quick Actions</h2>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            <Button
              variant={activeTab === 'channels' ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-left ${
                activeTab === 'channels' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => {
                setActiveTab('channels');
                setSelectedDM('');
              }}
            >
              <Hash className="h-4 w-4 mr-3" />
              Channels
            </Button>

            <Button
              variant={activeTab === 'dms' ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-left ${
                activeTab === 'dms' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => {
                setActiveTab('dms');
                setSelectedChannel('');
              }}
            >
              <MessageCircle className="h-4 w-4 mr-3" />
              Direct messages
            </Button>

            <Button
              variant={activeTab === 'search' ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-left ${
                activeTab === 'search' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setActiveTab('search')}
            >
              <Search className="h-4 w-4 mr-3" />
              Search
            </Button>

            <Button
              variant={activeTab === 'real-time' ? 'secondary' : 'ghost'}
              className={`w-full justify-start text-left ${
                activeTab === 'real-time' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => setActiveTab('real-time')}
            >
              <Clock className="h-4 w-4 mr-3" />
              Real time-messaging
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Slack Interface</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-600 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {slackStatus?.workspace?.teamName || 'Connected'}
                </Badge>
                <span className="text-sm text-gray-400">Live Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="flex-1 flex">
          {activeTab === 'channels' && (
            <>
              {/* Channels List */}
              <div className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3">Channels</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search channels..." 
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      value={channelSearch}
                      onChange={(e) => setChannelSearch(e.target.value)}
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {channelsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      filteredChannels.map((channel) => (
                        <Button
                          key={channel.id}
                          variant={selectedChannel === channel.id ? "secondary" : "ghost"}
                          className={`w-full justify-start text-left p-3 h-auto ${
                            selectedChannel === channel.id 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                          onClick={() => setSelectedChannel(channel.id)}
                          data-testid={`channel-${channel.id}`}
                        >
                          <Hash className="h-4 w-4 mr-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{channel.name}</div>
                            {channel.purpose && (
                              <div className="text-xs text-gray-400 truncate mt-1">
                                {channel.purpose}
                              </div>
                            )}
                          </div>
                          {channel.memberCount && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {channel.memberCount}
                            </Badge>
                          )}
                        </Button>
                      ))
                    )}
                    {filteredChannels.length === 0 && !channelsLoading && (
                      <p className="text-sm text-gray-400 text-center py-4">No channels found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col">
                {selectedChannel ? (
                  <>
                    {/* Messages Header */}
                    <div className="p-4 border-b border-gray-700 bg-gray-800">
                      <div className="flex items-center space-x-2">
                        <Hash className="h-5 w-5 text-gray-400" />
                        <h2 className="text-lg font-medium text-white">{getCurrentChannelName()}</h2>
                      </div>
                    </div>

                    {/* Messages List */}
                    <ScrollArea className="flex-1 p-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div key={message.id} className="flex space-x-3">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={message.userInfo?.image} />
                                <AvatarFallback className="bg-gray-600 text-white">
                                  {message.userInfo?.name?.charAt(0) || message.user.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-white text-sm">
                                    {message.userInfo?.realName || message.userInfo?.name || message.user}
                                  </span>
                                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed break-words">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          ))}
                          {messages.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No messages in this channel yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-700 bg-gray-800">
                      <div className="flex space-x-3">
                        <Textarea
                          placeholder={`Message #${getCurrentChannelName()}...`}
                          className="flex-1 min-h-[44px] max-h-32 resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sendMessage.isPending}
                          className="bg-purple-600 hover:bg-purple-700 px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Hash className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No messages in this channel yet</p>
                      <p className="text-sm">Select a channel to start viewing messages</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'dms' && (
            <>
              {/* Direct Messages List */}
              <div className="w-80 bg-gray-850 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-3">Direct Messages</h3>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-1">
                    {dmsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      directMessages.map((dm) => (
                        <Button
                          key={dm.id}
                          variant={selectedDM === dm.id ? "secondary" : "ghost"}
                          className={`w-full justify-start text-left p-3 h-auto ${
                            selectedDM === dm.id 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          }`}
                          onClick={() => setSelectedDM(dm.id)}
                        >
                          <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                            <AvatarImage src={dm.userImage} />
                            <AvatarFallback className="bg-gray-600 text-white text-xs">
                              {dm.userName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm truncate">{dm.userName}</span>
                              {dm.unread > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {dm.unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-1">{dm.lastMessage}</p>
                          </div>
                        </Button>
                      ))
                    )}
                    {directMessages.length === 0 && !dmsLoading && (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No direct messages</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* DM Messages Area */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a direct message conversation to start chatting</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'search' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Search feature coming soon</p>
                <p className="text-sm">Search across all your Slack messages and files</p>
              </div>
            </div>
          )}

          {activeTab === 'real-time' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Real-time messaging active</p>
                <p className="text-sm">Messages refresh automatically every 5 seconds</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}