import { useContext, useState } from "react";

// components
import { InventoryItem } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";
import { InventoryItemType } from "@shared/types";

export const SeedsMenu = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { ecosystemSeeds, visitorInventory } = useContext(GlobalStateContext);
  const { coins, seeds: visitorSeeds } = visitorInventory as typeof visitorInventory & {
    seeds: { [key: string]: InventoryItemType };
  };

  const availableSeeds = ecosystemSeeds && Object.values(ecosystemSeeds).filter((seed) => !visitorSeeds?.[seed.id]);

  const [purchasingSeeds, setPurchasingSeeds] = useState<Set<string>>(new Set());

  const handlePurchaseSeed = async (seedId: string) => {
    setPurchasingSeeds((prev) => new Set([...prev, seedId]));
    await backendAPI
      .post("/seed/purchase", { seedId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_INVENTORY,
          payload: { visitorInventory: response.data.visitorInventory, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingSeeds((prev) => {
          const updated = new Set(prev);
          updated.delete(seedId);
          return updated;
        });
      });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <>
      {availableSeeds && availableSeeds.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {availableSeeds.map((seed) => {
            const { name, rarity, cost, growthTime, harvestLevel, reward } = seed;

            return (
              <InventoryItem
                key={seed.id}
                coinsAvailable={coins}
                icon={seed.icon}
                name={name}
                description={formatTime(growthTime * harvestLevel)}
                rarity={rarity}
                cost={cost}
                value={reward}
                valueText="Profit"
                isPurchasing={purchasingSeeds.has(seed.id)}
                handlePurchase={() => handlePurchaseSeed(seed.id)}
                isReadyOnly={false}
              />
            );
          })}
        </div>
      ) : (
        <p className="p2">
          Nice work, you've already purchased all currently available seeds! Check back again later to see if new seeds
          have been added to the store.
        </p>
      )}
    </>
  );
};

export default SeedsMenu;
