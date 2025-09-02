import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Clock,
  BookOpen,
  Settings,
  LogOut,
  Link as LinkIcon,
  Zap,
  Menu,
  ExternalLink,
} from "lucide-react";
import { useSystemFeatures } from "@/hooks/useSystemFeatures";
import SearchModal from "@/components/SearchModal";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, badge: "5" },
  { name: "AI Search", href: "#", icon: Search, isSearchTrigger: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "SLA Management", href: "/sla", icon: Clock },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "System Integrations", href: "/integrations", icon: LinkIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ sidebarCollapsed = false }: { sidebarCollapsed?: boolean }) {
  const [location] = useLocation();
  const { availableFeatures, connectedSystemTypes } = useSystemFeatures();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();
  const { user } = useAuth();
  
  // Generate user initials
  const getUserInitials = () => {
    if (!user) return 'QL';
    const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || user.email?.charAt(0)?.toUpperCase() || 'U';
  };
  
  const getUserFullName = () => {
    if (!user) return 'QueryLinker User';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'User';
  };

  // Build navigation with system features
  const navigation = [...baseNavigation];
  
  // Add system-specific features to navigation
  if (availableFeatures.length > 0) {
    const systemFeatures = availableFeatures
      .filter(feature => feature.path && feature.path !== "/search")
      .slice(0, 3) // Limit to top 3 features
      .map(feature => ({
        name: feature.name,
        href: feature.path || "#",
        icon: Zap,
        badge: feature.dependencies.join(","),
        isSystemFeature: true,
      }));
      
    navigation.splice(-1, 0, ...systemFeatures); // Insert before Settings
  }

  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Modern collapsed view
  if (sidebarCollapsed) {
    return (
      <div className="w-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl h-full flex flex-col relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5 pointer-events-none" />
        
        {/* Collapsed Header */}
        <div className="p-4 flex-shrink-0 relative z-10">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40">
              <LinkIcon className="text-white text-lg drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* Collapsed Navigation */}
        <div className="flex-1 overflow-y-auto min-h-0 relative z-10">
          <nav className="py-4 space-y-2">
            {navigation.slice(0, 6).map((item, index) => {
              const isActive = location === item.href && !item.isSearchTrigger;
              const Icon = item.icon;

              if (item.isSearchTrigger) {
                return (
                  <div key={item.name} className="px-3">
                    <button
                      className="w-full h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 hover:bg-white/10 hover:backdrop-blur-sm hover:scale-105 group relative"
                      onClick={() => setIsSearchOpen(true)}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-purple-600/10 transition-all duration-300" />
                      <Icon className="h-6 w-6 text-slate-400 group-hover:text-white transition-all duration-300 group-hover:scale-110 drop-shadow-sm" />
                      <span className="text-xs text-slate-400 group-hover:text-white mt-1 font-medium transition-all duration-300">AI</span>
                    </button>
                  </div>
                );
              }

              return (
                <div key={item.name} className="px-3">
                  <Link href={item.href}>
                    <button
                      className={cn(
                        "w-full h-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 hover:scale-105 group relative",
                        isActive 
                          ? "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25" 
                          : "hover:bg-white/10 hover:backdrop-blur-sm"
                      )}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {!isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-purple-600/10 transition-all duration-300" />
                      )}
                      <Icon className={cn(
                        "h-6 w-6 transition-all duration-300 group-hover:scale-110 drop-shadow-sm",
                        isActive 
                          ? "text-white" 
                          : "text-slate-400 group-hover:text-white"
                      )} />
                      <span className={cn(
                        "text-xs mt-1 font-medium transition-all duration-300 text-center leading-tight",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-white"
                      )}>
                        {item.name === "System Integrations" ? "Systems" :
                         item.name === "SLA Management" ? "SLA" :
                         item.name === "Dashboard" ? "Home" :
                         item.name === "Analytics" ? "Stats" :
                         item.name === "Incident Management" ? "Incidents" :
                         item.name === "Advanced Analytics" ? "Advanced" :
                         item.name}
                      </span>
                      {item.badge && !isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse" />
                      )}
                    </button>
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>
        
        {/* Collapsed User Section */}
        <div className="p-3 relative z-10">
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 group"
              data-testid="logout-button"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
        
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    );
  }

  // Full expanded view
  return (
    <div className="w-64 bg-white dark:bg-slate-800 shadow-xl h-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
            <LinkIcon className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">QueryLinker</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">AI-Powered ITSM</p>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400">
            <span>Home</span>
            <span>/</span>
            <span className="text-primary font-medium">Dashboard</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500 dark:text-slate-400">Online</span>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <nav className="mt-6 px-4 pb-32 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href && !item.isSearchTrigger;
          const Icon = item.icon;

          if (item.isSearchTrigger) {
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  "w-full justify-start group transition-all duration-200",
                  "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                )}
                onClick={() => setIsSearchOpen(true)}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={cn(
                  "mr-3 h-4 w-4 transition-transform",
                  "text-gray-400 group-hover:text-primary group-hover:scale-110"
                )} />
                <span className="font-medium">{item.name}</span>
                {(item as any).badge && (
                  <Badge className="ml-auto bg-primary text-primary-foreground">
                    {(item as any).badge}
                  </Badge>
                )}
              </Button>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start group transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700",
                  (item as any).isSystemFeature && "border border-primary/20 bg-primary/5"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={cn(
                  "mr-3 h-4 w-4 transition-transform",
                  isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-primary group-hover:scale-110",
                  (item as any).isSystemFeature && "text-primary"
                )} />
                <span className="font-medium">{item.name}</span>
                {(item as any).badge && !(item as any).isSystemFeature && (
                  <Badge className="ml-auto bg-primary text-primary-foreground">
                    {(item as any).badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
        
        {/* Connected Systems Section */}
        {connectedSystemTypes.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Connected Workspaces ({connectedSystemTypes.filter(type => ['slack', 'googlemeet', 'zendesk', 'notion', 'linear', 'jira'].includes(type)).length})
            </p>
            <div className="space-y-1">
              {connectedSystemTypes
                .filter((systemType: string) => ['slack', 'googlemeet', 'zendesk', 'notion', 'linear', 'jira'].includes(systemType))
                .slice(0, 4)
                .map((systemType: string) => {
                  const systemConfigs = {
                    slack: { name: "Slack", icon: "💬", href: "/slack/interface" },
                    googlemeet: { name: "Google Meet", icon: "📹" },
                    zendesk: { name: "Zendesk", icon: "📋" },
                    notion: { name: "Notion", icon: "📝" },
                    linear: { name: "Linear", icon: "📋" },
                    jira: { name: "Jira", icon: "🎯" }
                  };
                  const config = systemConfigs[systemType as keyof typeof systemConfigs] || { name: systemType, icon: "🔧" };

                  return (
                    <Link key={systemType} href={config.href || `/workspace/${systemType}`}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start group transition-all duration-200 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        data-testid={`workspace-nav-${systemType}`}
                      >
                        <span className="mr-3 text-sm">{config.icon}</span>
                        <span className="font-medium text-sm">{config.name}</span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  );
                })
              }
            </div>
          </div>
        )}
        </nav>
      </div>

      {/* Fixed User Profile at Bottom */}
      <div className="absolute bottom-6 left-4 right-4 flex-shrink-0">
        <div className="bg-white/10 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-600/30">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserFullName()}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                {user?.role || 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
              data-testid="logout-button"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}

export default function Sidebar() {
  const { isMobile, openMobile, setOpenMobile, state, open } = useSidebar();

  // Determine if collapsed based on context state  
  const isCollapsed = state === "collapsed" || !open;

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }


  return (
    <aside
      className={cn(
        "bg-white dark:bg-slate-800 shadow-xl fixed left-0 top-0 h-full z-30 transition-all duration-300 ease-in-out hidden lg:block",
        isCollapsed ? 'w-20' : 'w-64'
      )}
      data-state={state}
    >
      <SidebarContent sidebarCollapsed={isCollapsed} />
    </aside>
  );
}
