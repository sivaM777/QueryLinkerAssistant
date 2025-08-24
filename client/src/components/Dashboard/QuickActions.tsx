import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Download, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function QuickActions() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/systems/sync-all");
    },
    onSuccess: () => {
      toast({
        title: "Sync Started",
        description: "All systems are being synchronized",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/systems"] });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to start system synchronization",
        variant: "destructive",
      });
    },
  });

  const exportReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports/export", { 
        type: "dashboard",
        format: "pdf" 
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Report Generated",
        description: "Dashboard report has been generated and downloaded",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed", 
        description: "Failed to generate dashboard report",
        variant: "destructive",
      });
    },
  });

  const actions = [
    {
      title: "Create Solution",
      icon: Plus,
      color: "primary",
      action: () => setLocation("/knowledge?action=create"),
    },
    {
      title: "Sync Systems", 
      icon: RefreshCw,
      color: "blue",
      action: () => syncAllMutation.mutate(),
      loading: syncAllMutation.isPending,
    },
    {
      title: "Export Report",
      icon: Download,
      color: "green", 
      action: () => exportReportMutation.mutate(),
      loading: exportReportMutation.isPending,
    },
    {
      title: "Settings",
      icon: Settings,
      color: "purple",
      action: () => setLocation("/settings"),
    },
  ];

  const getColorClasses = (color: string) => {
    const classes = {
      primary: {
        bg: "bg-primary/10",
        hover: "group-hover:bg-primary group-hover:text-primary-foreground",
        icon: "text-primary group-hover:text-primary-foreground",
        text: "group-hover:text-primary",
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        hover: "group-hover:bg-blue-500",
        icon: "text-blue-600 dark:text-blue-400 group-hover:text-white",
        text: "group-hover:text-blue-500",
      },
      green: {
        bg: "bg-green-100 dark:bg-green-900/30",
        hover: "group-hover:bg-green-500",
        icon: "text-green-600 dark:text-green-400 group-hover:text-white",
        text: "group-hover:text-green-500",
      },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        hover: "group-hover:bg-purple-500",
        icon: "text-purple-600 dark:text-purple-400 group-hover:text-white",
        text: "group-hover:text-purple-500",
      },
    };
    return classes[color as keyof typeof classes] || classes.primary;
  };

  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Common tasks and shortcuts
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const colors = getColorClasses(action.color);
            
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-gray-200 dark:border-slate-600 hover:border-transparent transition-all group"
                  onClick={action.action}
                  disabled={action.loading}
                  data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110 ${colors.bg} ${colors.hover}`}>
                    <Icon className={`h-6 w-6 transition-colors ${colors.icon} ${action.loading ? 'animate-spin' : ''}`} />
                  </div>
                  <span className={`text-sm font-medium text-gray-700 dark:text-slate-300 transition-colors ${colors.text}`}>
                    {action.title}
                  </span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
