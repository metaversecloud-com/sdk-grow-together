import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { seeds } from "@shared/index.js";

export const SeedMenu = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorData } = useContext(GlobalStateContext);
  const { coinsAvailable, seedsPurchased } = visitorData || { coinsAvailable: 0 };

  const [purchasingSeeds, setPurchasingSeeds] = useState<Set<number>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseSeed = async (seedId: number) => {
    setPurchasingSeeds((prev) => new Set([...prev, seedId]));
    setIsPurchasing(true);
    await backendAPI
      .post("/seed/purchase", { seedId })
      .then((response) => {
        dispatch!({
          type: SET_VISITOR_DATA,
          payload: { visitorData: response.data.visitorData, error: "" },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error as ErrorType))
      .finally(() => {
        setPurchasingSeeds((prev) => {
          const updated = new Set(prev);
          updated.delete(seedId);
          return updated;
        });
        setIsPurchasing(false);
      });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="Buy Seeds" disabled={isPurchasing} handleOnClick={onClose} />

        <YourMoney coinsAvailable={coinsAvailable || 0} />

        <div className="grid grid-cols-2 gap-2">
          {Object.values(seeds).map((seed) => {
            const { id, name, rarity, cost, icon, growthTime, reward } = seed;
            const purchased = seedsPurchased?.[id];
            const affordable = coinsAvailable >= cost;

            return (
              <PurchaseItem
                key={id}
                coinsAvailable={coinsAvailable || 0}
                id={id}
                available={affordable && !purchased}
                imageSrc={icon}
                name={name}
                description={formatTime(growthTime)}
                rarity={rarity}
                cost={cost}
                value={`Profit: +${reward - cost} coins`}
                canPurchaseAdditional={false}
                isPurchasing={purchasingSeeds.has(id)}
                handlePurchase={() => handlePurchaseSeed(id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeedMenu;
