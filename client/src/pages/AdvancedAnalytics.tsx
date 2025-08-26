import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/advanced", { timeRange }],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Mock data for demonstration
  const incidentTrendData = [
    { month: 'Jan', incidents: 45, resolved: 42, critical: 3 },
    { month: 'Feb', incidents: 52, resolved: 48, critical: 4 },
    { month: 'Mar', incidents: 38, resolved: 36, critical: 2 },
    { month: 'Apr', incidents: 61, resolved: 58, critical: 3 },
    { month: 'May', incidents: 44, resolved: 42, critical: 2 },
    { month: 'Jun', incidents: 35, resolved: 34, critical: 1 }
  ];

  const severityDistribution = [
    { name: 'Critical', value: 12, color: '#ef4444' },
    { name: 'High', value: 28, color: '#f97316' },
    { name: 'Medium', value: 45, color: '#eab308' },
    { name: 'Low', value: 32, color: '#3b82f6' }
  ];

  const resolutionTimeData = [
    { category: 'Network', avgTime: 4.2, target: 4.0 },
    { category: 'Hardware', avgTime: 6.8, target: 6.0 },
    { category: 'Software', avgTime: 3.1, target: 4.0 },
    { category: 'Security', avgTime: 2.5, target: 2.0 },
    { category: 'Database', avgTime: 5.2, target: 5.0 }
  ];

  const systemPerformanceData = [
    { time: '00:00', uptime: 99.8, response: 120 },
    { time: '04:00', uptime: 99.9, response: 95 },
    { time: '08:00', uptime: 99.7, response: 140 },
    { time: '12:00', uptime: 99.6, response: 180 },
    { time: '16:00', uptime: 99.8, response: 110 },
    { time: '20:00', uptime: 99.9, response: 85 }
  ];

  return (
    <div className="min-h-screen space-y-6 animate-fadeIn p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 lg:px-6 py-4 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              Advanced Analytics
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Deep insights into your IT service performance and trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">System Uptime</p>
                  <p className="text-2xl font-bold text-green-600">99.8%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+0.2%</span>
                <span className="text-gray-500 dark:text-slate-400 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">2.3s</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">-0.4s</span>
                <span className="text-gray-500 dark:text-slate-400 ml-1">improvement</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">SLA Compliance</p>
                  <p className="text-2xl font-bold text-purple-600">96.2%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">Above target</span>
                <span className="text-gray-500 dark:text-slate-400 ml-1">(95%)</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">User Satisfaction</p>
                  <p className="text-2xl font-bold text-orange-600">4.7/5</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+0.3</span>
                <span className="text-gray-500 dark:text-slate-400 ml-1">this quarter</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incident Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Incident Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incidentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="incidents" fill="#8884d8" name="Total Incidents" />
                    <Bar dataKey="resolved" fill="#82ca9d" name="Resolved" />
                    <Bar dataKey="critical" fill="#ff7300" name="Critical" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Severity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resolution Time by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Avg Resolution Time by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resolutionTimeData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgTime" fill="#8884d8" name="Actual Time (hours)" />
                    <Bar dataKey="target" fill="#82ca9d" name="Target Time (hours)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Incident Volume by Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Incident Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={incidentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="incidents" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Total Incidents"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="critical" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      name="Critical"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={systemPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="uptime" 
                    stackId="1"
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    name="Uptime (%)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="response" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Response Time (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium">Incident resolution improving</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Average resolution time decreased by 15% this quarter
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
                  <div>
                    <p className="font-medium">Peak hours identified</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Most incidents occur between 2-4 PM on weekdays
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium">SLA compliance stable</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Maintaining 96%+ compliance for 6 months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Resource Planning
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    Consider increasing staffing during 2-4 PM peak hours
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Automation Opportunity
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    Network incidents show patterns suitable for automation
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">
                    Training Focus
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                    Hardware issues take longer than target - training needed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
