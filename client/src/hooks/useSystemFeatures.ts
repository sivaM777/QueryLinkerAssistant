import { useQuery } from "@tanstack/react-query";

interface SystemFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  path?: string;
  component?: string;
  dependencies: string[]; // System types required for this feature
}

// Define system-specific features
const SYSTEM_FEATURES: SystemFeature[] = [
  {
    id: "jira-automation",
    name: "Jira Automation",
    description: "Automated workflow management for Jira issues",
    icon: "🎯",
    path: "/jira/automation",
    dependencies: ["jira"],
  },
  {
    id: "confluence-templates",
    name: "Page Templates",
    description: "Manage Confluence page templates and standards",
    icon: "📚",
    path: "/confluence/templates", 
    dependencies: ["confluence"],
  },
  {
    id: "github-actions",
    name: "GitHub Actions",
    description: "Monitor and manage CI/CD pipelines",
    icon: "💻",
    path: "/github/actions",
    dependencies: ["github"],
  },
  {
    id: "servicenow-incidents",
    name: "Incident Management",
    description: "ServiceNow incident tracking and resolution",
    icon: "☁️",
    path: "/servicenow/incidents",
    dependencies: ["servicenow", "servicenow-itsm"],
  },
  {
    id: "slack-commands",
    name: "Slack Commands",
    description: "Custom slash commands and bot interactions",
    icon: "💬",
    path: "/slack/commands",
    dependencies: ["slack"],
  },
  {
    id: "teams-integration",
    name: "Teams Integration",
    description: "Microsoft Teams collaboration features",
    icon: "💬",
    path: "/teams/integration",
    dependencies: ["teams"],
  },
  {
    id: "zendesk-support",
    name: "Support Portal",
    description: "Zendesk customer support integration",
    icon: "📋",
    path: "/zendesk/support",
    dependencies: ["zendesk"],
  },
  {
    id: "linear-projects",
    name: "Project Management",
    description: "Linear project and issue tracking",
    icon: "📋",
    path: "/linear/projects",
    dependencies: ["linear"],
  },
  {
    id: "notion-workspace",
    name: "Workspace Management",
    description: "Notion workspace organization tools",
    icon: "📝",
    path: "/notion/workspace",
    dependencies: ["notion"],
  },
  {
    id: "cross-platform-search",
    name: "Unified Search",
    description: "Search across multiple connected systems",
    icon: "🔍",
    dependencies: [], // Available when any system is connected
  },
  {
    id: "advanced-analytics",
    name: "Advanced Analytics",
    description: "Cross-platform analytics and insights",
    icon: "📊",
    path: "/analytics/advanced",
    dependencies: [], // Requires at least 2 systems
  },
];

export function useSystemFeatures() {
  const { data: systems, isLoading } = useQuery({
    queryKey: ["/api/systems"],
  });

  const connectedSystemTypes = (systems || [])
    .filter((system: any) => system.isActive)
    .map((system: any) => system.type);

  const availableFeatures = SYSTEM_FEATURES.filter(feature => {
    if (feature.dependencies.length === 0) {
      return connectedSystemTypes.length > 0; // Any system connected
    }

    // Special case for advanced analytics - show if any system is connected
    if (feature.id === 'advanced-analytics') {
      return connectedSystemTypes.length > 0;
    }

    return feature.dependencies.some(dep => connectedSystemTypes.includes(dep));
  });

  const getFeaturesBySystem = (systemType: string) => {
    return SYSTEM_FEATURES.filter(feature => 
      feature.dependencies.includes(systemType)
    );
  };

  const isFeatureEnabled = (featureId: string) => {
    const feature = SYSTEM_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;

    if (feature.dependencies.length === 0) {
      return connectedSystemTypes.length > 0;
    }

    return feature.dependencies.some(dep => connectedSystemTypes.includes(dep));
  };

  const getAdvancedFeatures = () => {
    return SYSTEM_FEATURES.filter(feature =>
      feature.id.includes('advanced') || feature.id.includes('cross-platform')
    ).filter(feature => {
      if (feature.id === 'advanced-analytics') {
        return connectedSystemTypes.length >= 1; // Show with at least 1 system
      }
      return connectedSystemTypes.length > 0;
    });
  };

  return {
    systems,
    connectedSystemTypes,
    availableFeatures,
    getFeaturesBySystem,
    isFeatureEnabled,
    getAdvancedFeatures,
    isLoading,
  };
}

export type { SystemFeature };
export { SYSTEM_FEATURES };
