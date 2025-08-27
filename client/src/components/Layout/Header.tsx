import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Moon, Sun, Search, Link as LinkIcon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HeaderProps {
  onSearchOpen?: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps = {}) {
  const { isDark, setTheme } = useTheme();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications?unread=true"),
  });

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchOpen) {
      onSearchOpen();
    }
  };

  const handleKeyboardShortcut = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (onSearchOpen) {
        onSearchOpen();
      }
    }
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20">
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1 lg:flex-initial">
            <div className="flex items-center">
              <SidebarTrigger className="flex-shrink-0 h-10 w-10 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">Dashboard</h2>
            </div>
            <Badge className="hidden sm:flex bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="hidden md:inline">All Systems Operational</span>
              <span className="md:hidden">Online</span>
            </Badge>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search solutions, tickets, or knowledge..."
                  className="w-64 lg:w-80 xl:w-96 pl-10 pr-16 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyboardShortcut}
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <div className="absolute right-3 top-2 hidden lg:block">
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-slate-600 text-xs rounded">⌘K</kbd>
                </div>
              </div>
            </form>

            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              onClick={() => {
                if (onSearchOpen) {
                  onSearchOpen();
                }
              }}
              data-testid="mobile-search-button"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              onClick={() => {
                toast({
                  title: "Notifications",
                  description: "No new notifications at this time",
                });
              }}
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
              {notifications && Array.isArray(notifications) && notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
