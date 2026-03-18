import { useContext } from "react";

// components
import { InventoryItem, NoItems } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const VisitorAccessories = ({
  handleShowInventoryModal,
}: {
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory?.accessories || Object.keys(visitorInventory.accessories).length === 0) {
    return (
      <>
        <h4>No accessories purchased.</h4>
        <NoItems handleShowInventoryModal={handleShowInventoryModal} />
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(visitorInventory.accessories).map(([id, accessory]) => {
          const { displayName, rarity, icon } = accessory;

          return (
            <InventoryItem
              key={id}
              icon={icon}
              name={displayName}
              rarity={rarity}
              valueText="Owned"
              isReadyOnly={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VisitorAccessories;
