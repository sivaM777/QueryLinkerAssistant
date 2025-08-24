import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface Incident {
  id: number;
  externalId: string;
  systemName: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  impact: string;
  startedAt: string;
  resolvedAt?: string;
  externalUrl?: string;
  affectedServices: string[];
}

export default function ActiveIncidents() {
  const [, setLocation] = useLocation();
  const { data: incidents, isLoading } = useQuery({
    queryKey: ["/api/incidents/active"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'investigating':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'identified':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'monitoring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Active Incidents
              </CardTitle>
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeIncidents = incidents || [];
  const criticalIncidents = activeIncidents.filter((i: Incident) => i.severity === 'critical');
  const hasIncidents = activeIncidents.length > 0;

  return (
    <Card data-testid="active-incidents">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${hasIncidents ? 'text-red-500' : 'text-green-500'}`} />
              Active Incidents
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {hasIncidents 
                ? `${activeIncidents.length} active, ${criticalIncidents.length} critical`
                : "All systems operational"
              }
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/incidents")}
            data-testid="view-all-incidents"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasIncidents ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Active Incidents
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              All monitored services are operating normally.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeIncidents.slice(0, 5).map((incident: Incident, index: number) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                data-testid={`incident-${incident.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(incident.status)}>
                        {incident.status}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(incident.startedAt)}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {incident.title}
                    </h4>
                    
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                      {incident.systemName}
                    </p>
                    
                    {incident.affectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {incident.affectedServices.slice(0, 3).map((service, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {incident.affectedServices.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{incident.affectedServices.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {incident.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                        {incident.description}
                      </p>
                    )}
                  </div>
                  
                  {incident.externalUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4"
                      onClick={() => window.open(incident.externalUrl, '_blank')}
                      data-testid={`incident-link-${incident.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            
            {activeIncidents.length > 5 && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-slate-700">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/incidents")}
                >
                  View {activeIncidents.length - 5} more incidents
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}