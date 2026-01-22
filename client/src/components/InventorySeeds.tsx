import { useContext } from "react";

// components
import { InventoryItem, NoItems } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const InventorySeeds = ({
  handleShowInventoryModal,
}: {
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory?.seeds || Object.keys(visitorInventory.seeds).length === 0) {
    return (
      <>
        <h4>No seeds purchased.</h4>
        <NoItems handleShowInventoryModal={handleShowInventoryModal} />
      </>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.values(visitorInventory.seeds).map((seed) => {
        const { id, name, icon, rarity, cost, growthTime, harvestLevel, reward } = seed;

        return (
          <InventoryItem
            key={id}
            id={id}
            icon={icon}
            name={name}
            description={formatTime(growthTime * harvestLevel)}
            rarity={rarity}
            cost={cost}
            value={reward}
            valueText="Profit"
            isReadyOnly={true}
          />
        );
      })}
    </div>
  );
};

export default InventorySeeds;
