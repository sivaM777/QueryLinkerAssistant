import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, AlertTriangle, Clock, CheckCircle, TrendingUp, Download } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import SLAExportModal from "@/components/SLAExportModal";

export default function SLAManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newSLA, setNewSLA] = useState({
    name: "",
    type: "",
    threshold: "",
    escalationPolicy: "",
  });


  const { data: slaTargets, isLoading: targetsLoading } = useQuery({
    queryKey: ["/api/sla/targets"],
    
  });

  const { data: slaStatus } = useQuery({
    queryKey: ["/api/sla/status"],
    
  });

  const addSLAMutation = useMutation({
    mutationFn: async (slaData: any) => {
      await apiRequest("POST", "/api/sla/targets", slaData);
    },
    onSuccess: () => {
      toast({
        title: "SLA Target Created",
        description: "New SLA target added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sla/targets"] });
      setShowAddDialog(false);
      setNewSLA({ name: "", type: "", threshold: "", escalationPolicy: "" });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create SLA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock SLA data
  const mockSLATargets = [
    {
      id: 1,
      name: "Response Time",
      type: "response_time",
      threshold: "2 hours",
      current: "1.2h",
      compliance: 98.7,
      status: "met" as const,
      isActive: true,
      escalationPolicy: { levels: [{ time: "1h", notify: "team" }, { time: "2h", notify: "manager" }] },
    },
    {
      id: 2,
      name: "Resolution Time",
      type: "resolution_time",
      threshold: "24 hours",
      current: "22.8h",
      compliance: 89.2,
      status: "at_risk" as const,
      isActive: true,
      escalationPolicy: { levels: [{ time: "12h", notify: "team" }, { time: "20h", notify: "manager" }] },
    },
    {
      id: 3,
      name: "Escalation Time",
      type: "escalation_time",
      threshold: "4 hours",
      current: "4.5h",
      compliance: 76.3,
      status: "breached" as const,
      isActive: true,
      escalationPolicy: { levels: [{ time: "2h", notify: "team" }, { time: "4h", notify: "director" }] },
    },
  ];

  const complianceTrendData = [
    { month: "Jan", responseTime: 95, resolutionTime: 88, escalationTime: 92 },
    { month: "Feb", responseTime: 97, resolutionTime: 85, escalationTime: 89 },
    { month: "Mar", responseTime: 96, resolutionTime: 91, escalationTime: 87 },
    { month: "Apr", responseTime: 98, resolutionTime: 89, escalationTime: 85 },
    { month: "May", responseTime: 99, resolutionTime: 92, escalationTime: 78 },
    { month: "Jun", responseTime: 98.7, resolutionTime: 89.2, escalationTime: 76.3 },
  ];

  const breachAnalysisData = [
    { category: "Network Issues", breaches: 12, severity: "High" },
    { category: "Database Problems", breaches: 8, severity: "Critical" },
    { category: "Authentication", breaches: 5, severity: "Medium" },
    { category: "Performance", breaches: 15, severity: "High" },
    { category: "Security", breaches: 3, severity: "Critical" },
  ];

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

  const handleAddSLA = () => {
    if (!newSLA.name || !newSLA.type || !newSLA.threshold) return;
    
    addSLAMutation.mutate({
      name: newSLA.name,
      type: newSLA.type,
      threshold: newSLA.threshold,
      escalationPolicy: JSON.parse(newSLA.escalationPolicy || "{}"),
      isActive: true,
    });
  };


  const targets = slaTargets || mockSLATargets;
  const overallCompliance = targets.reduce((acc: number, target: any) => acc + target.compliance, 0) / targets.length;

  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="sla-management-page">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SLA Management</h1>
            <p className="text-gray-500 dark:text-slate-400">Service level agreement monitoring and management</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            data-testid="export-sla-report"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-sla-button">
                <Plus className="h-4 w-4 mr-2" />
                Add SLA Target
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-sla-dialog">
              <DialogHeader>
                <DialogTitle>Add New SLA Target</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Define a new service level agreement target with escalation policies.
                </p>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="sla-name">SLA Name</Label>
                  <Input
                    id="sla-name"
                    value={newSLA.name}
                    onChange={(e) => setNewSLA(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Response Time for P1 Incidents"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sla-type">SLA Type</Label>
                  <Select value={newSLA.type} onValueChange={(value) => setNewSLA(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SLA type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="response_time">Response Time</SelectItem>
                      <SelectItem value="resolution_time">Resolution Time</SelectItem>
                      <SelectItem value="escalation_time">Escalation Time</SelectItem>
                      <SelectItem value="availability">System Availability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sla-threshold">Threshold</Label>
                  <Input
                    id="sla-threshold"
                    value={newSLA.threshold}
                    onChange={(e) => setNewSLA(prev => ({ ...prev, threshold: e.target.value }))}
                    placeholder="e.g., 2 hours, 24 hours, 99.9%"
                  />
                </div>
                
                <div>
                  <Label htmlFor="escalation-policy">Escalation Policy (JSON)</Label>
                  <Textarea
                    id="escalation-policy"
                    value={newSLA.escalationPolicy}
                    onChange={(e) => setNewSLA(prev => ({ ...prev, escalationPolicy: e.target.value }))}
                    placeholder='{"levels": [{"time": "1h", "notify": "team"}, {"time": "2h", "notify": "manager"}]}'
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddSLA}
                    disabled={!newSLA.name || !newSLA.type || !newSLA.threshold || addSLAMutation.isPending}
                    data-testid="confirm-add-sla"
                  >
                    {addSLAMutation.isPending ? "Creating..." : "Create SLA"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SLA Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Active SLAs", value: targets.length.toString(), icon: Clock, color: "blue", change: "3 targets" },
          { title: "Breached SLAs", value: targets.filter((t: any) => t.status === "breached").length.toString(), icon: AlertTriangle, color: "red", change: "1 critical" },
          { title: "Overall Compliance", value: `${overallCompliance.toFixed(1)}%`, icon: CheckCircle, color: "green", change: "+2.1% this month" },
          { title: "At Risk", value: targets.filter((t: any) => t.status === "at_risk").length.toString(), icon: TrendingUp, color: "yellow", change: "Requires attention" },
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200" data-testid={`sla-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{metric.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{metric.change}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                      <Icon className={`h-6 w-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Current SLA Status */}
      <Card data-testid="current-sla-status">
        <CardHeader>
          <CardTitle>Current SLA Status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring of all service level agreements
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {targetsLoading ? (
              [...Array(3)].map((_, i) => (
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
              ))
            ) : (
              targets.map((sla: any, index: number) => (
                <motion.div
                  key={sla.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl"
                  data-testid={`sla-status-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(sla.status)}`} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sla.name}</p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Target: {sla.threshold}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getComplianceColor(sla.compliance)}`}>
                      {sla.current}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {sla.compliance}% compliance
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                Overall SLA Performance
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {overallCompliance.toFixed(1)}%
              </span>
            </div>
            <Progress value={overallCompliance} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trends */}
        <Card data-testid="compliance-trends">
          <CardHeader>
            <CardTitle>Compliance Trends</CardTitle>
            <p className="text-sm text-muted-foreground">SLA compliance over the last 6 months</p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] min-h-[300px] chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" className="text-gray-600 dark:text-slate-400" />
                  <YAxis className="text-gray-600 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="responseTime" stroke="#22c55e" strokeWidth={2} name="Response Time" />
                  <Line type="monotone" dataKey="resolutionTime" stroke="#3b82f6" strokeWidth={2} name="Resolution Time" />
                  <Line type="monotone" dataKey="escalationTime" stroke="#f59e0b" strokeWidth={2} name="Escalation Time" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breach Analysis */}
        <Card data-testid="breach-analysis">
          <CardHeader>
            <CardTitle>Breach Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">SLA breaches by category this month</p>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] min-h-[300px] chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breachAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                  <XAxis dataKey="category" className="text-gray-600 dark:text-slate-400" />
                  <YAxis className="text-gray-600 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="breaches" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalation Policies */}
      <Card data-testid="escalation-policies">
        <CardHeader>
          <CardTitle>Escalation Policies</CardTitle>
          <p className="text-sm text-muted-foreground">
            Automated escalation workflows for SLA breaches
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {targets.map((sla: any, index: number) => (
              <motion.div
                key={sla.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{sla.name}</h4>
                  <Badge variant={sla.isActive ? "default" : "secondary"}>
                    {sla.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {sla.escalationPolicy?.levels?.map((level: any, levelIndex: number) => (
                    <div key={levelIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {levelIndex + 1}
                      </div>
                      <span className="text-gray-600 dark:text-slate-400">
                        After {level.time} → Notify {level.notify}
                      </span>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500 dark:text-slate-400">No escalation policy defined</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Modal */}
      <SLAExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        slaData={targets}
        overallCompliance={overallCompliance}
      />
    </div>
  );
}
