import { GlobalStateContext } from "@/context/GlobalContext";
import { useContext } from "react";

// Define or import EcosystemInventoryItemType
type EcosystemInventoryItemType = {
  name: string;
  icon: string;
  description: string;
};

export const AppliedToolIcons = ({ appliedTools }: { appliedTools: string[] | undefined }) => {
  const { ecosystemTools = {} } = useContext(GlobalStateContext);

  return (
    <div style={{ width: "30px" }}>
      {appliedTools?.map((toolName, index) => {
        const tool = Object.values(ecosystemTools).find((item: EcosystemInventoryItemType) => item.name === toolName);

        if (!tool) return null;

        return (
          <div key={index} className="tooltip mb-1">
            <span className="tooltip-content" style={{ width: "125px", left: "60px" }}>
              {toolName}: {tool.description}
            </span>
            <div className="icon icon-sm">
              <img src={tool.icon} alt={toolName} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
