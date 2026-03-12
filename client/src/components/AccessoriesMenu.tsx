import { useContext, useState } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const AccessoriesMenu = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemAccessories, visitorInventory = { coins: 0, accessories: {} } } = useContext(GlobalStateContext);

  const [purchasingAccessories, setPurchasingAccessories] = useState<Set<string>>(new Set());

  const handlePurchaseAccessory = async (accessoryId: string) => {
    setPurchasingAccessories((prev) => new Set([...prev, accessoryId]));
    await backendAPI
      .post("/accessory/purchase", { accessoryId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingAccessories((prev) => {
          const updated = new Set(prev);
          updated.delete(accessoryId);
          return updated;
        });
      });
  };

  // Filter out accessories already owned by the visitor (both keyed by id)
  const ownedAccessoryIds = new Set(Object.keys(visitorInventory.accessories || {}));
  const availableAccessories =
    ecosystemAccessories && Object.entries(ecosystemAccessories).filter(([id]) => !ownedAccessoryIds.has(id));

  return (
    <>
      {availableAccessories && availableAccessories.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {availableAccessories.map(([id, accessory]) => {
            const { displayName, rarity, cost, icon } = accessory;

            return (
              <InventoryItem
                key={id}
                coinsAvailable={visitorInventory.coins}
                icon={icon}
                name={displayName}
                rarity={rarity}
                cost={cost}
                isPurchasing={purchasingAccessories.has(id)}
                handlePurchase={() => handlePurchaseAccessory(id)}
                isReadyOnly={false}
              />
            );
          })}
        </div>
      ) : (
        <p className="p2">
          Nice work, you've already purchased all currently available accessories! Check back again later to see if new
          accessories have been added to the store.
        </p>
      )}
    </>
  );
};

export default AccessoriesMenu;
