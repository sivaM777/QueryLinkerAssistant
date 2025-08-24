import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Shield, Bell, Palette, Database, Users, Webhook } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  const [generalSettings, setGeneralSettings] = useState({
    organizationName: "QueryLinker Inc.",
    timezone: "UTC",
    defaultLanguage: "en",
    enableAnalytics: true,
    enableNotifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    enforceSSO: false,
    sessionTimeout: "8",
    passwordPolicy: "strong",
    enableAuditLog: true,
    enableMFA: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: "",
    notifyOnSLABreach: true,
    notifyOnSystemSync: false,
    digestFrequency: "daily",
  });

  const [systemSettings, setSystemSettings] = useState({
    maxCacheSize: "5",
    syncInterval: "15",
    searchResultLimit: "100",
    enableMLRanking: true,
    enableRealTimeUpdates: true,
  });


  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (settingsType: string, settings: any) => {
    saveSettingsMutation.mutate({ type: settingsType, settings });
  };


  return (
    <div className="p-6 space-y-6 animate-fadeIn" data-testid="settings-page">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-500 dark:text-slate-400">Manage your application configuration and preferences</p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card data-testid="general-settings">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Basic configuration for your QueryLinker instance
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={generalSettings.organizationName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, organizationName: e.target.value }))}
                    data-testid="organization-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={generalSettings.defaultLanguage} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, defaultLanguage: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect usage analytics to improve the platform
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.enableAnalytics}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, enableAnalytics: checked }))}
                    data-testid="analytics-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive system notifications and alerts
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.enableNotifications}
                    onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, enableNotifications: checked }))}
                    data-testid="notifications-toggle"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('general', generalSettings)}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="save-general-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card data-testid="security-settings">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure authentication and security policies
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enforce Single Sign-On (SSO)</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to authenticate through SSO only
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enforceSSO}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enforceSSO: checked }))}
                    data-testid="sso-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Multi-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require additional verification for enhanced security
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableMFA}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableMFA: checked }))}
                    data-testid="mfa-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all user actions for security monitoring
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableAuditLog}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, enableAuditLog: checked }))}
                    data-testid="audit-log-toggle"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                  <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <Select value={securitySettings.passwordPolicy} onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, passwordPolicy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                      <SelectItem value="strong">Strong (12+ chars, mixed case, numbers)</SelectItem>
                      <SelectItem value="strict">Strict (16+ chars, special characters)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('security', securitySettings)}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="save-security-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card data-testid="notification-settings">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how and when you receive notifications
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    data-testid="email-notifications-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SLA Breach Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when SLA targets are breached
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.notifyOnSLABreach}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, notifyOnSLABreach: checked }))}
                    data-testid="sla-breach-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Sync Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when system synchronization completes
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.notifyOnSystemSync}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, notifyOnSystemSync: checked }))}
                    data-testid="system-sync-toggle"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={notificationSettings.webhookUrl}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-webhook-endpoint.com/notify"
                    data-testid="webhook-url-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Send notifications to external systems via webhook
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
                  <Select value={notificationSettings.digestFrequency} onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, digestFrequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('notifications', notificationSettings)}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="save-notification-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card data-testid="appearance-settings">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize the look and feel of your interface
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {["light", "dark", "system"].map((themeOption) => (
                      <motion.div
                        key={themeOption}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={theme === themeOption ? "default" : "outline"}
                          className="w-full h-20 flex flex-col items-center justify-center gap-2"
                          onClick={() => setTheme(themeOption as any)}
                          data-testid={`theme-${themeOption}`}
                        >
                          <div className="w-6 h-6 rounded border">
                            {themeOption === "light" && <div className="w-full h-full bg-white border-gray-300 rounded" />}
                            {themeOption === "dark" && <div className="w-full h-full bg-gray-900 border-gray-600 rounded" />}
                            {themeOption === "system" && (
                              <div className="w-full h-full bg-gradient-to-r from-white to-gray-900 border-gray-400 rounded" />
                            )}
                          </div>
                          <span className="text-xs capitalize">{themeOption}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose from predefined color schemes or customize your own
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: "Default", primary: "#6366f1", secondary: "#8b5cf6" },
                      { name: "Ocean", primary: "#0891b2", secondary: "#06b6d4" },
                      { name: "Forest", primary: "#059669", secondary: "#10b981" },
                      { name: "Sunset", primary: "#ea580c", secondary: "#f97316" },
                    ].map((scheme) => (
                      <Button
                        key={scheme.name}
                        variant="outline"
                        className="h-16 flex flex-col items-center justify-center gap-1"
                        data-testid={`color-scheme-${scheme.name.toLowerCase()}`}
                      >
                        <div className="flex gap-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: scheme.primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: scheme.secondary }}
                          />
                        </div>
                        <span className="text-xs">{scheme.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('appearance', { theme })}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="save-appearance-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card data-testid="system-settings">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure system performance and integration settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cache-size">Max Cache Size (GB)</Label>
                  <Select value={systemSettings.maxCacheSize} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, maxCacheSize: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 GB</SelectItem>
                      <SelectItem value="2">2 GB</SelectItem>
                      <SelectItem value="5">5 GB</SelectItem>
                      <SelectItem value="10">10 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Select value={systemSettings.syncInterval} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, syncInterval: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-limit">Search Result Limit</Label>
                  <Select value={systemSettings.searchResultLimit} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, searchResultLimit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 results</SelectItem>
                      <SelectItem value="100">100 results</SelectItem>
                      <SelectItem value="200">200 results</SelectItem>
                      <SelectItem value="500">500 results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable ML Ranking</Label>
                    <p className="text-sm text-muted-foreground">
                      Use machine learning to improve search result ranking
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableMLRanking}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableMLRanking: checked }))}
                    data-testid="ml-ranking-toggle"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Real-time Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get live updates via WebSocket connections
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableRealTimeUpdates}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableRealTimeUpdates: checked }))}
                    data-testid="realtime-updates-toggle"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSaveSettings('system', systemSettings)}
                  disabled={saveSettingsMutation.isPending}
                  data-testid="save-system-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card data-testid="system-status">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                Current system health and performance metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">Online</div>
                  <div className="text-sm text-muted-foreground">System Status</div>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    All systems operational
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                  <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">142ms</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                  <div className="text-xs text-muted-foreground mt-1">Average</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
