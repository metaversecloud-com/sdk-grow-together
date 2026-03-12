import { useContext } from "react";

// components
import { InventoryItem, NoItems } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const VisitorDecorations = ({
  handleShowInventoryModal,
}: {
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory?.decorations || Object.keys(visitorInventory.decorations).length === 0) {
    return (
      <>
        <h4>No decorations purchased.</h4>
        <NoItems handleShowInventoryModal={handleShowInventoryModal} />
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(visitorInventory.decorations).map((decoration) => {
          const { name, rarity, availableQuantity, icon } = decoration;

          return (
            <InventoryItem
              key={name}
              icon={icon}
              name={name}
              rarity={rarity}
              value={availableQuantity}
              valueText="Available"
              isReadyOnly={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VisitorDecorations;
