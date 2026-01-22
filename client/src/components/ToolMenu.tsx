import { useContext, useState } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const ToolMenu = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemTools, visitorInventory = { coins: 0 } } = useContext(GlobalStateContext);

  const [purchasingTools, setPurchasingTools] = useState<Set<string>>(new Set());

  const handlePurchaseTool = async (toolName: string) => {
    setPurchasingTools((prev) => new Set([...prev, toolName]));
    await backendAPI
      .post("/tool/purchase", { toolName })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingTools((prev) => {
          const updated = new Set(prev);
          updated.delete(toolName);
          return updated;
        });
      });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {ecosystemTools &&
          Object.values(ecosystemTools).map((tool) => {
            const { id, name, description, rarity, cost, quantity, icon } = tool;

            return (
              <InventoryItem
                key={id}
                coinsAvailable={visitorInventory.coins}
                id={id}
                icon={icon}
                name={name}
                description={description}
                rarity={rarity}
                cost={cost}
                quantity={quantity}
                isPurchasing={purchasingTools.has(id)}
                handlePurchase={() => handlePurchaseTool(name)}
                isReadyOnly={false}
                showDescriptionTooltip={true}
              />
            );
          })}
      </div>
    </div>
  );
};

export default ToolMenu;
