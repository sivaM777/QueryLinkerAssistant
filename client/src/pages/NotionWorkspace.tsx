import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Database,
  Search,
  Plus,
  ExternalLink,
  BookOpen,
  Users,
  Calendar,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function NotionWorkspace() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for demonstration
  const pages = [
    { id: 1, title: "IT Service Management Guide", type: "page", lastModified: "2024-01-15T10:30:00Z" },
    { id: 2, title: "Incident Response Playbook", type: "page", lastModified: "2024-01-15T09:15:00Z" },
    { id: 3, title: "Knowledge Base", type: "database", lastModified: "2024-01-14T16:20:00Z" },
    { id: 4, title: "Team Directory", type: "database", lastModified: "2024-01-14T14:45:00Z" }
  ];

  return (
    <div className="min-h-screen space-y-6 animate-fadeIn p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 lg:px-6 py-4 -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-gray-700" />
              Notion Workspace
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Manage your Notion pages and databases
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Notion
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pages and databases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Databases</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Contributors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Last Update</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2h</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pages & Databases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {pages.map((page, index) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      {page.type === 'database' ? (
                        <Database className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {page.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {page.type}
                        </Badge>
                        <span>Modified {new Date(page.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
