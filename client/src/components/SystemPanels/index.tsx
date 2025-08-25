import { useSystemFeatures } from "@/hooks/useSystemFeatures";
import SlackPanel from "./SlackPanel";
import TeamsPanel from "./TeamsPanel";
import ServiceNowPanel from "./ServiceNowPanel";
import ZendeskPanel from "./ZendeskPanel";
import LinearPanel from "./LinearPanel";
import NotionPanel from "./NotionPanel";

export default function AutoSystemPanels() {
  const { connectedSystemTypes } = useSystemFeatures();

  const systemPanels = [
    {
      type: "slack",
      component: <SlackPanel key="slack" />,
    },
    {
      type: "teams",
      component: <TeamsPanel key="teams" />,
    },
    {
      type: "servicenow-itsm",
      component: <ServiceNowPanel key="servicenow-itsm" />,
    },
    {
      type: "servicenow",
      component: <ServiceNowPanel key="servicenow" />,
    },
    {
      type: "zendesk",
      component: <ZendeskPanel key="zendesk" />,
    },
    {
      type: "linear",
      component: <LinearPanel key="linear" />,
    },
    {
      type: "notion",
      component: <NotionPanel key="notion" />,
    },
  ];

  // Filter panels based on connected systems
  const activePanels = systemPanels.filter(panel => 
    connectedSystemTypes.includes(panel.type)
  );

  if (activePanels.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="auto-system-panels">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connected System Panels
        </h2>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {activePanels.length} active integration{activePanels.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activePanels.map(panel => panel.component)}
      </div>
    </div>
  );
}

export {
  SlackPanel,
  TeamsPanel,
  ServiceNowPanel,
  ZendeskPanel,
  LinearPanel,
  NotionPanel,
};