interface PurchaseItemProps {
  coinsAvailable: number;
  id: string;
  icon: string;
  name: string;
  description?: string;
  rarity: string;
  cost: number;
  value: string;
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
  isPurchasing,
  handlePurchase,
}: PurchaseItemProps) => {
  const affordable = coinsAvailable >= cost;
  return (
    <div key={id} className="card menu-card">
      <img className="mx-auto" src={icon} style={{ maxHeight: "100px" }} />
      <div className="card-details">
        <div className="tooltip" style={{ maxWidth: "100%" }}>
          <span className="tooltip-content">{name}</span>
          <h4 className="card-title ellipsis">{name}</h4>
        </div>

        <div className="grid">
          <p className={`p3 ${rarity.toLowerCase()}`}>
            <i>{rarity}</i>
          </p>
          {description && <p className="p3">{description}</p>}
          <p className="p3 text-success">{value}</p>
        </div>
        <p className="p3 text-muted">
          <i>Price: {cost}</i>
        </p>

        <div className="card-actions">
          <button
            className="btn btn-outline p3"
            onClick={() => handlePurchase(id)}
            disabled={!affordable || isPurchasing}
          >
            {isPurchasing ? "Purchasing..." : "Buy"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseItem;
