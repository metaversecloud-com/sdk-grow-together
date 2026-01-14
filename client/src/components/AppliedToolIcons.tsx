import { GlobalStateContext } from "@/context/GlobalContext";
import { useContext } from "react";

// Define or import EcosystemInventoryItemType
type EcosystemInventoryItemType = {
  name: string;
  icon?: string;
};

export const AppliedToolIcons = ({ appliedTools }: { appliedTools: string[] | undefined }) => {
  const { tools = {} } = useContext(GlobalStateContext);

  return (
    <div style={{ width: "30px" }}>
      {appliedTools?.map((toolName, index) => {
        const toolIcon = Object.values(tools).find((item: EcosystemInventoryItemType) => item.name === toolName)?.icon;
        return (
          <div key={index} className="tooltip mb-1 ">
            <span className="tooltip-content">{toolName}</span>
            {toolIcon ? (
              <div className="icon icon-sm">
                <img src={toolIcon} alt={toolName} />
              </div>
            ) : (
              <div className="p2 icon icon-sm">🌱</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
