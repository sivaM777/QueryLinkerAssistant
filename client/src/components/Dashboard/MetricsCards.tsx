import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Database, 
  Clock, 
  Search, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle 
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface MetricsData {
  totalSolutions: number;
  activeSLAs: number;
  searchSuccessRate: number;
  activeUsers: number;
  systemsConnected: number;
  incidentsResolved: number;
  avgResolutionTime: string;
  activeIncidents?: number;
  criticalIncidents?: number;
  dataSourcesActive?: number;
}

interface MetricsCardsProps {
  metrics?: MetricsData;
  isLoading: boolean;
}

export default function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const [, setLocation] = useLocation();

  const cards = [
    {
      title: "Total Solutions",
      value: metrics?.totalSolutions?.toLocaleString() || "0",
      change: "+12% from last month",
      changeType: "positive" as const,
      icon: Database,
      color: "blue",
      href: "/knowledge",
    },
    {
      title: "Active Incidents",
      value: metrics?.activeIncidents?.toString() || "0",
      change: `${metrics?.criticalIncidents || 0} critical`,
      changeType: (metrics?.criticalIncidents || 0) > 0 ? "warning" as const : "info" as const,
      icon: AlertTriangle,
      color: (metrics?.criticalIncidents || 0) > 0 ? "red" as "red" : "green",
      href: "/incidents",
    },
    {
      title: "Data Sources",
      value: metrics?.dataSourcesActive?.toString() || "0",
      change: "Live monitoring",
      changeType: "positive" as const,
      icon: Database,
      color: "blue",
      href: "/integrations",
    },
    {
      title: "Avg. Resolution Time",
      value: metrics?.avgResolutionTime || "0m",
      change: "156 online now",
      changeType: "info" as const,
      icon: Clock,
      color: "purple",
      href: "/sla",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = {
          blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
          purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
          red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        };

        const changeClasses = {
          positive: "text-green-600 dark:text-green-400",
          warning: "text-red-600 dark:text-red-400",
          info: "text-blue-600 dark:text-blue-400",
        };

        const changeIcons = {
          positive: TrendingUp,
          warning: AlertTriangle,
          info: Users,
        };

        const ChangeIcon = changeIcons[card.changeType];

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              onClick={() => setLocation(card.href)}
              data-testid={`metric-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {card.value}
                    </p>
                    <p className={`text-sm mt-1 flex items-center gap-1 ${changeClasses[card.changeType]}`}>
                      <ChangeIcon className="h-3 w-3" />
                      {card.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[card.color]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
