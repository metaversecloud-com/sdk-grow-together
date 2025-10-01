import { useContext, useState } from "react";

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
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseSeed = async (seedId: number) => {
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
        <h2 className="h2">🌱 Seed Menu</h2>

        <div className="card small">
          <div className="card-details">
            <h4 className="card-title">💰 {visitorData.coinsAvailable} Coins Available</h4>
            <p className="p3">Total Earned: {visitorData.totalCoinsEarned}</p>
          </div>
        </div>

        <div className="grid gap-2">
          {Object.values(seeds).map((seed) => {
            const purchased = isPurchased(seed.id);
            const affordable = canAfford(seed.cost);
            const free = isFree(seed.cost);

            return (
              <div key={seed.id} className={`card ${!affordable && !free && !purchased ? "opacity-50" : ""}`}>
                <div className="card-details text-center">
                  <h4 className="card-title flex justify-center">
                    <img className="mr-2" src={seed.icon} />
                    {seed.name}
                  </h4>
                  <div className="flex justify-center mt-2">
                    <div className="flex-col mr-2">
                      <p className="p3">Cost: {seed.cost === 0 ? "Free" : `${seed.cost} coins`}</p>
                      <p className="p3">Reward: {seed.reward} coins</p>
                    </div>
                    <div className="flex-col">
                      <p className="p3">Growth: {formatTime(seed.growthTime)}</p>
                      <p className="p3">Profit: +{seed.reward - seed.cost} coins</p>
                    </div>
                  </div>

                  <div className="card-actions justify-center">
                    {free ? (
                      <span className="p3 text-success">✓ Available</span>
                    ) : purchased ? (
                      <span className="p3 text-success">✓ Purchased</span>
                    ) : affordable ? (
                      <button
                        className="btn btn-outline"
                        onClick={() => handlePurchaseSeed(seed.id)}
                        disabled={isPurchasing}
                      >
                        {isPurchasing ? "Purchasing..." : `Buy ${seed.cost} coins`}
                      </button>
                    ) : (
                      <span className="p3 text-muted">Need {seed.cost - visitorData.coinsAvailable} more coins</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button className="btn" onClick={onClose}>
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeedMenu;
