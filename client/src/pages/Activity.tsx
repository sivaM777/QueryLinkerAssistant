import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { User, RefreshCw, AlertTriangle, Brain, Calendar, Filter, Search, Clock, Activity as ActivityIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Activity() {
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/activity"],
  });

  const mockActivity = [
    {
      id: 1,
      type: "user_action",
      icon: User,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      user: "Sarah Johnson",
      action: "created a new solution for",
      topic: "Database Performance Issues",
      topicColor: "text-primary",
      timestamp: "5 minutes ago",
      details: "Added comprehensive troubleshooting steps and SQL optimization techniques",
    },
    {
      id: 2,
      type: "system_sync",
      icon: RefreshCw,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      action: "System sync completed for",
      system: "Jira Cloud",
      details: "247 new tickets imported",
      timestamp: "12 minutes ago",
    },
    {
      id: 3,
      type: "sla_breach",
      icon: AlertTriangle,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      alert: "SLA breach alert:",
      ticketId: "#SRV-4521",
      details: "exceeded resolution time by 2 hours",
      timestamp: "18 minutes ago",
    },
    {
      id: 4,
      type: "ai_training",
      icon: Brain,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      action: "AI model retrained with",
      dataPoints: "1,247 new data points",
      improvement: "Accuracy improved to 97.3%",
      timestamp: "25 minutes ago",
    },
    {
      id: 5,
      type: "user_action",
      icon: User,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      user: "Mike Chen",
      action: "resolved ticket",
      topic: "#INC-8923",
      topicColor: "text-green-600",
      timestamp: "1 hour ago",
      details: "Network connectivity issue fixed by restarting core switch",
    },
    {
      id: 6,
      type: "system_sync",
      icon: RefreshCw,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      action: "System sync completed for",
      system: "ServiceNow",
      details: "89 tickets updated, 12 new incidents",
      timestamp: "1 hour ago",
    },
    {
      id: 7,
      type: "user_action",
      icon: User,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      user: "Lisa Rodriguez",
      action: "updated knowledge article",
      topic: "Email Configuration Guide",
      topicColor: "text-primary",
      timestamp: "2 hours ago",
      details: "Added steps for modern authentication and OAuth setup",
    },
    {
      id: 8,
      type: "sla_breach",
      icon: AlertTriangle,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      alert: "SLA warning:",
      ticketId: "#REQ-7788",
      details: "approaching deadline in 30 minutes",
      timestamp: "2 hours ago",
    },
  ];

  const activities = activity || mockActivity;

  const filteredActivities = activities.filter((item: any) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch = searchQuery === "" || 
      JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "user_action": return "User Actions";
      case "system_sync": return "System Sync";
      case "sla_breach": return "SLA Alerts";
      case "ai_training": return "AI Training";
      default: return "All Activity";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-4 mt-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ActivityIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Feed</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Track all system activities, user actions, and events
          </p>
        </div>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
            <Badge variant="secondary" className="ml-auto">
              {filteredActivities.length} items
            </Badge>
          </CardTitle>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="user_action">User Actions</SelectItem>
                <SelectItem value="system_sync">System Sync</SelectItem>
                <SelectItem value="sla_breach">SLA Alerts</SelectItem>
                <SelectItem value="ai_training">AI Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">No activities match your filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => { setFilterType("all"); setSearchQuery(""); }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredActivities.map((item: any, index: number) => {
                const Icon = item.icon;
                
                return (
                  <motion.div
                    key={item.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <Avatar className={`h-10 w-10 ${item.bgColor} flex-shrink-0`}>
                      <AvatarFallback className={`${item.bgColor} border-0`}>
                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-white mb-1">
                        {/* User action type */}
                        {item.type === "user_action" && (
                          <>
                            <span className="font-medium">{item.user}</span>
                            <span className="text-gray-500 dark:text-slate-400"> {item.action} </span>
                            <span className={`font-medium ${item.topicColor}`}>"{item.topic}"</span>
                          </>
                        )}
                        
                        {/* System sync type */}
                        {item.type === "system_sync" && (
                          <>
                            <span className="text-gray-500 dark:text-slate-400">{item.action} </span>
                            <span className="font-medium">{item.system}</span>
                            <span className="text-gray-500 dark:text-slate-400"> - {item.details}</span>
                          </>
                        )}
                        
                        {/* SLA breach type */}
                        {item.type === "sla_breach" && (
                          <>
                            <Badge variant={item.alert.includes("warning") ? "secondary" : "destructive"} className="mr-2">
                              {item.alert}
                            </Badge>
                            <span className="text-gray-500 dark:text-slate-400">Ticket </span>
                            <span className="font-medium">{item.ticketId}</span>
                            <span className="text-gray-500 dark:text-slate-400"> {item.details}</span>
                          </>
                        )}
                        
                        {/* AI training type */}
                        {item.type === "ai_training" && (
                          <>
                            <span className="text-gray-500 dark:text-slate-400">{item.action} </span>
                            <span className="font-medium">{item.dataPoints}</span>
                            <span className="text-gray-500 dark:text-slate-400"> - </span>
                            <span className="font-medium text-green-600 dark:text-green-400">{item.improvement}</span>
                          </>
                        )}
                      </div>
                      
                      {item.details && (
                        <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                          {item.details}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.timestamp}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(item.type)}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
