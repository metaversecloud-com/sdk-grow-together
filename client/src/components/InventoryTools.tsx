import { useContext } from "react";

// components
import { InventoryItem, NoItems } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const InventoryTools = ({
  handleShowInventoryModal,
}: {
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory?.tools || Object.keys(visitorInventory.tools).length === 0) {
    return (
      <>
        <h4>No tools purchased.</h4>
        <NoItems handleShowInventoryModal={handleShowInventoryModal} />
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(visitorInventory.tools).map((tool) => {
          const { id, name, description, rarity, quantity, icon } = tool;

          return (
            <InventoryItem
              key={id}
              id={id}
              icon={icon}
              name={name}
              description={description}
              rarity={rarity}
              value={quantity}
              valueText="Owned"
              isReadyOnly={true}
              showDescriptionTooltip={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default InventoryTools;
