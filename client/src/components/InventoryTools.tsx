import { useContext } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const InventoryTools = () => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory || !visitorInventory.tools) {
    return (
      <>
        <h4>No tools purchased.</h4>
        <p>Click "View Store" in the garden store to purchase more tools.</p>
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
