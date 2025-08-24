import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Brain, Flame, Shield, Network, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface RecentSearchesProps {
  onSearchOpen?: (query: string) => void;
}

export default function RecentSearches({ onSearchOpen }: RecentSearchesProps) {
  const { data: recentSearches, isLoading } = useQuery({
    queryKey: ["/api/search/recent"],
  });

  const mockSearches = [
    {
      id: 1,
      query: "Database connection timeout error",
      resultsCount: 127,
      confidence: 98,
      timestamp: "2m ago",
      icon: Brain,
      gradient: "from-primary to-purple-600",
    },
    {
      id: 2,
      query: "High CPU usage server monitoring",
      resultsCount: 89,
      confidence: 94,
      timestamp: "5m ago",
      icon: Flame,
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: 3,
      query: "SSL certificate renewal process",
      resultsCount: 45,
      confidence: 99,
      timestamp: "8m ago",
      icon: Shield,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      query: "Network latency troubleshooting",
      resultsCount: 203,
      confidence: 96,
      timestamp: "15m ago",
      icon: Network,
      gradient: "from-blue-500 to-indigo-500",
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Searches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const searches = recentSearches || mockSearches;

  return (
    <Card data-testid="recent-searches">
      <CardHeader>
        <CardTitle>Recent AI Searches</CardTitle>
        <p className="text-sm text-muted-foreground">
          Popular queries and solutions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {searches.map((search: any, index: number) => {
          const Icon = search.icon || Brain;
          
          return (
            <motion.div
              key={search.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer group"
              onClick={() => onSearchOpen?.(search.query)}
              data-testid={`search-item-${index}`}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${search.gradient || 'from-primary to-purple-600'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {search.query}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <span>Found {search.resultsCount} solutions</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        search.confidence >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        search.confidence >= 90 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}
                    >
                      {search.confidence}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {search.timestamp}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
