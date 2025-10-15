interface PurchaseItemProps {
  coinsAvailable: number;
  id: string;
  icon: string;
  name: string;
  description: string;
  rarity: string;
  cost: number;
  value: string;
  canPurchaseAdditional: boolean;
  isPurchasing: boolean;
  handlePurchase: (id: string) => void;
}

export const PurchaseItem = ({
  coinsAvailable,
  id,
  icon,
  name,
  description,
  rarity,
  cost,
  value,
  canPurchaseAdditional,
  isPurchasing,
  handlePurchase,
}: PurchaseItemProps) => {
  const affordable = coinsAvailable >= cost;
  return (
    <div key={id} className={`card ${!affordable ? "opacity-50" : ""}`}>
      <img className="mx-auto" src={icon} style={{ maxHeight: "100px" }} />
      <div className="card-details">
        <h4 className="card-title">{name}</h4>

        <div className="grid">
          <p className={`p3 ${rarity.toLowerCase()}`}>
            <i>{rarity}</i>
          </p>
          <p className="p3">{description}</p>
          <p className="p3 text-success">{value}</p>
        </div>
        <p className="p3 text-muted">
          <i>Price: {cost} Coins</i>
        </p>

        <div className="card-actions">
          {affordable ? (
            <button className="btn btn-outline p3" onClick={() => handlePurchase(id)} disabled={isPurchasing}>
              {isPurchasing ? "Purchasing..." : "Buy"}
            </button>
          ) : (
            canPurchaseAdditional && <span className="p3 text-muted">Need {cost - coinsAvailable} more coins</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseItem;
