import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Search, Lightbulb, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: suggestions } = useQuery({
    queryKey: ["/api/search/popular"],
    enabled: !searchQuery,
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest("POST", "/api/search", { query });
    },
    onSuccess: (data) => {
      setShowResults(true);
    },
  });

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      searchMutation.mutate(query);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const mockSuggestions = [
    {
      query: "How to resolve memory leaks in Java applications",
      systems: ["Jira", "Confluence", "GitHub"],
    },
    {
      query: "Database connection pool configuration",
      systems: ["ServiceNow", "Confluence"],
    },
    {
      query: "SSL certificate installation and renewal",
      systems: ["Jira", "ServiceNow"],
    },
    {
      query: "Server monitoring and alerting setup",
      systems: ["GitHub", "ServiceNow"],
    },
  ];

  const suggestedSearches = suggestions || mockSuggestions;

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setShowResults(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl mx-4 p-0 gap-0 bg-white dark:bg-slate-800 border-0 shadow-2xl"
        data-testid="search-modal"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Modal</DialogTitle>
        </DialogHeader>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              type="text"
              placeholder="Search across all systems..."
              className="w-full pl-12 pr-12 py-3 text-lg bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              data-testid="search-modal-input"
            />
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
              onClick={onClose}
              data-testid="search-modal-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {showResults && searchMutation.data ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Search Results ({searchMutation.data.resultsCount})
                </h4>
                {searchMutation.data.results.map((result: any, index: number) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    onClick={() => {
                      if (result.url) {
                        window.open(result.url, '_blank');
                      }
                      onClose();
                    }}
                    data-testid={`search-result-${index}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {result.content?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {result.system?.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {result.url && "External Link"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : searchMutation.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Searching...
                </h4>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                  Suggested Searches
                </h4>
                <div className="space-y-2">
                  {suggestedSearches.map((suggestion: any, index: number) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group"
                      onClick={() => handleSearch(suggestion.query)}
                      data-testid={`search-suggestion-${index}`}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                          {suggestion.query}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {suggestion.systems.join(", ")}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
