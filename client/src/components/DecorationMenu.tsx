import { useContext, useState } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const DecorationMenu = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemDecorations, visitorInventory = { coins: 0 } } = useContext(GlobalStateContext);

  const [purchasingDecorations, setPurchasingDecorations] = useState<Set<string>>(new Set());

  const handlePurchaseDecoration = async (decorationName: string) => {
    setPurchasingDecorations((prev) => new Set([...prev, decorationName]));
    await backendAPI
      .post("/decoration/purchase", { decorationName })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingDecorations((prev) => {
          const updated = new Set(prev);
          updated.delete(decorationName);
          return updated;
        });
      });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {ecosystemDecorations &&
          Object.values(ecosystemDecorations).map((decoration) => {
            const { name, rarity, cost, icon } = decoration;

            return (
              <InventoryItem
                key={name}
                coinsAvailable={visitorInventory.coins}
                icon={icon}
                name={name}
                rarity={rarity}
                cost={cost}
                isPurchasing={purchasingDecorations.has(name)}
                handlePurchase={() => handlePurchaseDecoration(name)}
                isReadyOnly={false}
              />
            );
          })}
      </div>
    </div>
  );
};

export default DecorationMenu;
