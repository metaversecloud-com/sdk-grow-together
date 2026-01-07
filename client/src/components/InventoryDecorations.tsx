import { useContext } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const InventoryDecorations = () => {
  const { visitorInventory } = useContext(GlobalStateContext);

  if (!visitorInventory || !visitorInventory.decorations) {
    return (
      <>
        <h4>No decorations purchased.</h4>
        <p>Click "View Store" in the garden store to purchase a decoration.</p>
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(visitorInventory.decorations).map((decoration) => {
          const { id, name, rarity, availableQuantity, icon } = decoration;

          return (
            <InventoryItem
              key={id}
              id={id}
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

export default InventoryDecorations;
