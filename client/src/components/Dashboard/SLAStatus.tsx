import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function SLAStatus() {
  const [, setLocation] = useLocation();
  const { data: slaStatus, isLoading } = useQuery({
    queryKey: ["/api/sla/status"],
  });

  const mockSLAData = [
    {
      id: 1,
      name: "Response Time",
      target: "< 2 hours",
      current: "1.2h",
      compliance: 98.7,
      status: "met" as const,
    },
    {
      id: 2,
      name: "Resolution Time",
      target: "< 24 hours",
      current: "22.8h",
      compliance: 89.2,
      status: "at_risk" as const,
    },
    {
      id: 3,
      name: "Escalation Time",
      target: "< 4 hours",
      current: "4.5h",
      compliance: 76.3,
      status: "breached" as const,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SLA Status</CardTitle>
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-3 w-3 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
          <div className="pt-6 border-t space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const slaTargets = slaStatus || mockSLAData;
  const overallPerformance = slaTargets.reduce((acc: number, target: any) => acc + target.compliance, 0) / slaTargets.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "met":
        return "bg-green-500";
      case "at_risk":
        return "bg-yellow-500 animate-pulse";
      case "breached":
        return "bg-red-500 animate-pulse";
      default:
        return "bg-gray-500";
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 95) return "text-green-600 dark:text-green-400";
    if (compliance >= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card data-testid="sla-status">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SLA Status</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Service level agreement monitoring
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/sla")}
            data-testid="view-sla-details"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slaTargets.map((sla: any, index: number) => (
            <motion.div
              key={sla.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl"
              data-testid={`sla-item-${index}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(sla.status)}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {sla.name || sla.target?.name || 'SLA Target'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Target: {typeof sla.target === 'string' ? sla.target : sla.target?.threshold || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${getComplianceColor(sla.compliance || 0)}`}>
                  {sla.current || sla.currentValue || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {(sla.compliance || 0).toFixed(1)}%
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
              Overall SLA Performance
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {overallPerformance.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={overallPerformance} 
            className="h-2"
            data-testid="overall-sla-progress"
          />
        </div>
      </CardContent>
    </Card>
  );
}
