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
import { Video, Phone, Share, Calendar, Users, MessageCircle, FileUp } from "lucide-react";

export default function TeamsPanel() {
  const [newMessage, setNewMessage] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - replace with real Teams API calls
  const teams = [
    { id: "general", name: "General", members: 25, unread: 2 },
    { id: "dev-team", name: "Development Team", members: 12, unread: 0 },
    { id: "marketing", name: "Marketing", members: 8, unread: 1 },
  ];

  const meetings = [
    {
      id: 1,
      title: "Sprint Planning",
      time: "3:00 PM - 4:00 PM",
      attendees: 8,
      status: "upcoming"
    },
    {
      id: 2,
      title: "Daily Standup",
      time: "9:00 AM - 9:30 AM",
      attendees: 12,
      status: "recurring"
    },
    {
      id: 3,
      title: "Product Review",
      time: "Tomorrow 2:00 PM",
      attendees: 6,
      status: "scheduled"
    },
  ];

  const recentFiles = [
    { id: 1, name: "Project Proposal.docx", size: "2.4 MB", modified: "2 hours ago", type: "document" },
    { id: 2, name: "Design Mockups.pdf", size: "15.2 MB", modified: "4 hours ago", type: "pdf" },
    { id: 3, name: "Budget Spreadsheet.xlsx", size: "1.8 MB", modified: "1 day ago", type: "spreadsheet" },
  ];

  const startMeeting = useMutation({
    mutationFn: async ({ title, type }: { title: string; type: string }) => {
      // Replace with actual Teams API call
      await apiRequest("/api/integrations/teams/meeting", { method: "POST", body: JSON.stringify({ title, type }) });
    },
    onSuccess: () => {
      toast({
        title: "Meeting Started",
        description: "Teams meeting has been initiated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start Meeting",
        description: "Could not create Teams meeting",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ team, message }: { team: string; message: string }) => {
      // Replace with actual Teams API call
      await apiRequest("/api/integrations/teams/message", { method: "POST", body: JSON.stringify({ team, message }) });
    },
    onSuccess: () => {
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been posted to Teams",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send",
        description: "Could not send message to Teams",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ team: selectedTeam, message: newMessage });
  };

  return (
    <Card className="h-96" data-testid="teams-panel">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          Microsoft Teams
          <Badge variant="secondary" className="ml-auto">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-full">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            <div className="p-3 border-b">
              <div className="flex flex-wrap gap-1">
                {teams.map((team) => (
                  <Button
                    key={team.id}
                    variant={selectedTeam === team.id ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedTeam(team.id)}
                    data-testid={`team-${team.id}`}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {team.name}
                    {team.unread > 0 && (
                      <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                        {team.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                <div className="text-center text-sm text-gray-500 py-4">
                  Recent messages will appear here
                </div>
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="outline" size="sm" data-testid="video-call-button">
                  <Video className="h-4 w-4 mr-1" />
                  Video Call
                </Button>
                <Button variant="outline" size="sm" data-testid="audio-call-button">
                  <Phone className="h-4 w-4 mr-1" />
                  Audio Call
                </Button>
                <Button variant="outline" size="sm" data-testid="share-screen-button">
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Textarea
                  placeholder={`Message ${selectedTeam} team`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none min-h-[60px] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  data-testid="teams-message-input"
                />
                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="sm" data-testid="attach-file-button">
                    <FileUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessage.isPending}
                    data-testid="send-teams-message-button"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-3 py-3">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                    data-testid={`meeting-${meeting.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{meeting.title}</h4>
                      <Badge variant={meeting.status === "upcoming" ? "default" : "secondary"}>
                        {meeting.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{meeting.time}</span>
                      <span>{meeting.attendees} attendees</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" data-testid={`join-meeting-${meeting.id}`}>
                        <Video className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                      <Button size="sm" variant="ghost" data-testid={`edit-meeting-${meeting.id}`}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button 
                className="w-full" 
                onClick={() => startMeeting.mutate({ title: "Quick Meeting", type: "instant" })}
                disabled={startMeeting.isPending}
                data-testid="start-instant-meeting"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Instant Meeting
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="files" className="flex-1 flex flex-col m-0">
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 py-3">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer"
                    data-testid={`file-${file.id}`}
                  >
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                      <FileUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.size} • {file.modified}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button variant="outline" className="w-full" data-testid="upload-file-button">
                <FileUp className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}