import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, Download, Calendar } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

export default function Analytics() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("30");

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: popularSolutions } = useQuery({
    queryKey: ["/api/analytics/popular-solutions"],
  });

  // Mock data for charts - in real app this would come from API
  const systemPopularityData = [
    { name: "CHAT", value: 4, color: "#8b5cf6" },
    { name: "CONFLUENCE", value: 1, color: "#3b82f6" },
    { name: "GITHUB", value: 1, color: "#374151" },
    { name: "JIRA", value: 1, color: "#f97316" },
    { name: "SN_KB", value: 1, color: "#14b8a6" },
  ];

  const systemEffectivenessData = [
    { name: "CHAT", effectiveness: 0.7, color: "#ef4444" },
    { name: "CONFLUENCE", effectiveness: 50.7, color: "#22c55e" },
    { name: "GITHUB", effectiveness: 50.7, color: "#22c55e" },
    { name: "JIRA", effectiveness: 50.7, color: "#22c55e" },
    { name: "SN_KB", effectiveness: 50.7, color: "#22c55e" },
  ];

  const usageTrendsData = [
    { date: "Jan", searches: 120, solutions: 45, slaCompliance: 95 },
    { date: "Feb", searches: 135, solutions: 52, slaCompliance: 92 },
    { date: "Mar", searches: 148, solutions: 61, slaCompliance: 96 },
    { date: "Apr", searches: 162, solutions: 58, slaCompliance: 94 },
    { date: "May", searches: 175, solutions: 67, slaCompliance: 97 },
    { date: "Jun", searches: 188, solutions: 72, slaCompliance: 93 },
  ];

  const topSuggestionsData = [
    { category: "Database Issues", count: 45, trend: "+12%" },
    { category: "Network Problems", count: 38, trend: "+8%" },
    { category: "Authentication", count: 32, trend: "-3%" },
    { category: "Performance", count: 28, trend: "+15%" },
    { category: "Security", count: 24, trend: "+5%" },
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];


  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">QueryLinker Analytics</h1>
            <p className="text-gray-500 dark:text-slate-400">Performance insights and usage analytics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod} data-testid="period-selector">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" data-testid="refresh-analytics">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" data-testid="export-analytics">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Interactions", value: "8", icon: "👤", change: "+12%", positive: true },
          { title: "Active Users", value: "1", icon: "👥", change: "+8%", positive: true },
          { title: "Unique Incidents", value: "5", icon: "📊", change: "-3%", positive: false },
          { title: "Avg Effectiveness", value: "40.7%", icon: "⭐", change: "+5%", positive: true },
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200" data-testid={`metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
                    <p className={`text-sm mt-1 ${metric.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {metric.change} from last period
                    </p>
                  </div>
                  <div className="text-3xl">{metric.icon}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Popularity */}
        <Card data-testid="system-popularity-chart">
          <CardHeader>
            <CardTitle>System Popularity</CardTitle>
            <p className="text-sm text-muted-foreground">Link interactions by system</p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] min-h-[300px] chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemPopularityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" className="text-gray-600 dark:text-slate-400" />
                  <YAxis className="text-gray-600 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Effectiveness */}
        <Card data-testid="system-effectiveness-chart">
          <CardHeader>
            <CardTitle>System Effectiveness</CardTitle>
            <p className="text-sm text-muted-foreground">Effectiveness scores by system</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemEffectivenessData.map((system, index) => (
                <div key={system.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{system.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {system.effectiveness}%
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={system.effectiveness > 25 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                      >
                        {system.effectiveness > 25 ? 'Good' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${system.effectiveness}%`,
                        backgroundColor: system.color 
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {system.effectiveness < 10 ? 'Low relevance - review suggestion algorithms' : 'Good relevance but low usage - increase visibility'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends and Cache Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Trends */}
        <Card className="lg:col-span-2" data-testid="usage-trends-chart">
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <p className="text-sm text-muted-foreground">Search activity and solution creation over time</p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] min-h-[300px] chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis dataKey="date" className="text-gray-600 dark:text-slate-400" />
                  <YAxis className="text-gray-600 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="searches" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="solutions" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                  <Line type="monotone" dataKey="slaCompliance" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Suggestions */}
        <Card data-testid="top-suggestions">
          <CardHeader>
            <CardTitle>Top Suggestions</CardTitle>
            <p className="text-sm text-muted-foreground">Most common search categories</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSuggestionsData.map((item, index) => (
                <motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.category}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{item.count} searches</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={item.trend.startsWith('+') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}
                  >
                    {item.trend}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance */}
      <Card data-testid="cache-performance">
        <CardHeader>
          <CardTitle>Cache Performance</CardTitle>
          <p className="text-sm text-muted-foreground">System performance and optimization metrics</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">98.5%</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cache Hit Rate</div>
              <div className="text-xs text-gray-400 mt-1">Excellent performance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">142ms</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Avg Response Time</div>
              <div className="text-xs text-gray-400 mt-1">Within targets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.1GB</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">Cache Size</div>
              <div className="text-xs text-gray-400 mt-1">Optimal utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
