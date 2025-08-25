import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";
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

function SidebarContent() {
  const [location] = useLocation();
  const { availableFeatures, connectedSystemTypes } = useSystemFeatures();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const handleLogout = () => {
    // Clear any stored data and redirect to login
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/landing';
  };

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
        
        {/* System Features Section */}
        {connectedSystemTypes.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              System Features ({connectedSystemTypes.length} connected)
            </p>
            <div className="space-y-1">
              {availableFeatures.slice(0, 2).map((feature) => (
                <div
                  key={feature.id}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary cursor-pointer"
                  title={feature.description}
                >
                  <span className="mr-2">{feature.icon}</span>
                  {feature.name}
                </div>
              ))}
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
                QL
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                QueryLinker User
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                User
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
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

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
    <aside className="w-64 bg-white dark:bg-slate-800 shadow-xl fixed left-0 top-0 h-full z-30 transition-all duration-300 hidden lg:block">
      <SidebarContent />
    </aside>
  );
}
