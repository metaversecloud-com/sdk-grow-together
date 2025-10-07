import { useContext, useState } from "react";

// components
import { ModalHeader, PurchaseItem, YourMoney } from "@/components";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ErrorType, SET_VISITOR_DATA } from "@/context/types";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// types
import { seeds, VisitorDataObjectType } from "@shared/index.js";

interface SeedMenuProps {
  visitorData: VisitorDataObjectType;
  onClose: () => void;
}

export const SeedMenu = ({ visitorData, onClose }: SeedMenuProps) => {
  const dispatch = useContext(GlobalDispatchContext);
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

  const canAfford = (cost: number) => visitorData.coinsAvailable >= cost;
  const isPurchased = (seedId: number) => visitorData.seedsPurchased[seedId] || false;
  const isFree = (cost: number) => cost === 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="Buy Seeds" disabled={isPurchasing} handleOnClick={onClose} />

        <YourMoney coinsAvailable={visitorData.coinsAvailable || 0} />

        <div className="grid grid-cols-2 gap-2">
          {Object.values(seeds).map((seed) => {
            const purchased = isPurchased(seed.id);
            const affordable = canAfford(seed.cost);
            const free = isFree(seed.cost);

            return (
              <PurchaseItem
                coinsAvailable={visitorData.coinsAvailable || 0}
                id={seed.id}
                available={!affordable && !free && !purchased}
                imageSrc={seed.icon}
                name={seed.name}
                description={formatTime(seed.growthTime)}
                rarity={seed.rarity}
                cost={seed.cost}
                value={`Profit: +${seed.reward - seed.cost} coins`}
                canPurchaseAdditional={false}
                isPurchasing={purchasingSeeds.has(seed.id)}
                handlePurchase={() => handlePurchaseSeed(seed.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeedMenu;
