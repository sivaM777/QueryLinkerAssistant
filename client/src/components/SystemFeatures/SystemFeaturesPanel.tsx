import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSystemFeatures, SystemFeature } from "@/hooks/useSystemFeatures";
import { motion } from "framer-motion";
import { ExternalLink, Zap } from "lucide-react";

interface SystemFeaturesPanelProps {
  title?: string;
  showAll?: boolean;
}

export default function SystemFeaturesPanel({ 
  title = "System Features", 
  showAll = false 
}: SystemFeaturesPanelProps) {
  const { 
    availableFeatures, 
    connectedSystemTypes, 
    getAdvancedFeatures,
    isLoading 
  } = useSystemFeatures();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading features...</div>
        </CardContent>
      </Card>
    );
  }

  if (connectedSystemTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Zap className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Systems Connected
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-4">
              Connect systems to unlock powerful features and integrations.
            </p>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Add System Integration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const features = showAll ? availableFeatures : availableFeatures.slice(0, 6);
  const advancedFeatures = getAdvancedFeatures();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary">
            {connectedSystemTypes.length} system{connectedSystemTypes.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Features available based on your connected systems: {connectedSystemTypes.join(", ")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {advancedFeatures.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Advanced Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {advancedFeatures.map((feature, index) => (
                <FeatureCard 
                  key={feature.id} 
                  feature={feature} 
                  index={index}
                  isAdvanced 
                />
              ))}
            </div>
          </div>
        )}

        {!showAll && availableFeatures.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              View All Features ({availableFeatures.length - 6} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FeatureCardProps {
  feature: SystemFeature;
  index: number;
  isAdvanced?: boolean;
}

function FeatureCard({ feature, index, isAdvanced = false }: FeatureCardProps) {
  const handleFeatureClick = () => {
    if (feature.path) {
      window.location.href = feature.path;
    } else {
      alert(`${feature.name} feature coming soon!`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
        isAdvanced 
          ? "bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-900/20 border-primary/20" 
          : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 border-gray-200 dark:border-slate-600"
      }`}
      onClick={handleFeatureClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{feature.icon}</div>
        {isAdvanced && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Advanced
          </Badge>
        )}
      </div>
      <h5 className="font-medium text-gray-900 dark:text-white mb-1">
        {feature.name}
      </h5>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
        {feature.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {feature.dependencies.slice(0, 2).map((dep) => (
            <Badge key={dep} variant="outline" className="text-xs">
              {dep}
            </Badge>
          ))}
          {feature.dependencies.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{feature.dependencies.length - 2}
            </Badge>
          )}
        </div>
        {feature.path && (
          <ExternalLink className="h-3 w-3 text-gray-400" />
        )}
      </div>
    </motion.div>
  );
}