import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Clock,
  BookOpen,
  Settings,
  LogOut,
  Link as LinkIcon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, badge: "5" },
  { name: "AI Search", href: "/search", icon: Search },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "SLA Management", href: "/sla", icon: Clock },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 shadow-xl fixed left-0 top-0 h-full z-30 transition-all duration-300">
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
            <LinkIcon className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">QueryLinker</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">AI-Powered ITSM</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start group transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className={cn(
                  "mr-3 h-4 w-4 transition-transform",
                  isActive ? "text-primary-foreground" : "text-gray-400 group-hover:text-primary group-hover:scale-110"
                )} />
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <Badge className="ml-auto bg-primary text-primary-foreground">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
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
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
