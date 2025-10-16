import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_INVENTORY } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const SeedMenu = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory = {}, seeds } = useContext(GlobalStateContext);

  const [purchasingSeeds, setPurchasingSeeds] = useState<Set<string>>(new Set());
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseSeed = async (seedId: string) => {
    setPurchasingSeeds((prev) => new Set([...prev, seedId]));
    setIsPurchasing(true);
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

        <YourMoney coinsAvailable={visitorInventory["Coins"]?.quantity || 0} />

        <div className="grid grid-cols-2 gap-2">
          {seeds &&
            Object.values(seeds).map((seed) => {
              const { id, name, rarity, cost, growthTime, reward } = seed;

              if (visitorInventory?.[name]) return null;

              return (
                <PurchaseItem
                  key={id}
                  coinsAvailable={visitorInventory["Coins"]?.quantity || 0}
                  id={id}
                  icon={seeds[id].icon}
                  name={name}
                  description={formatTime(growthTime)}
                  rarity={rarity}
                  cost={cost}
                  value={`Profit: +${reward} coins`}
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
