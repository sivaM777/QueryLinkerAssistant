import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User, RefreshCw, AlertTriangle, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function RecentActivity() {
  const [, setLocation] = useLocation();
  const { data: activity, isLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
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
      details: "exceeded resolution time",
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
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-8 w-8 rounded-full mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const activities = activity || mockActivity;

  return (
    <Card data-testid="recent-activity">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest system updates and user interactions
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/activity")}
            data-testid="view-all-activity"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((item: any, index: number) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4"
                data-testid={`activity-item-${index}`}
              >
                <Avatar className={`h-8 w-8 ${item.bgColor} flex-shrink-0 mt-1`}>
                  <AvatarFallback className={`${item.bgColor} border-0`}>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-white">
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
                        <Badge variant="destructive" className="mr-1">
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
                  
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {item.timestamp}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
