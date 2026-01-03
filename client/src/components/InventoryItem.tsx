interface InventoryItemProps {
  coinsAvailable?: number;
  id: string;
  icon: string;
  name: string;
  description?: string;
  rarity: string;
  cost?: number;
  value?: number;
  valueText?: string;
  isPurchasing?: boolean;
  isReadyOnly?: boolean;
  handlePurchase?: (id: string) => void;
}

export const InventoryItem = ({
  coinsAvailable,
  id,
  icon,
  name,
  description,
  rarity = "Common",
  cost,
  value,
  valueText,
  isPurchasing,
  isReadyOnly,
  handlePurchase,
}: InventoryItemProps) => {
  return (
    <div key={id} className="card menu-card">
      <img className="mx-auto" src={icon} style={{ maxHeight: "100px" }} />
      <div className="card-details">
        <div className="tooltip" style={{ maxWidth: "100%" }}>
          <span className="tooltip-content">{name}</span>
          <h5 className="card-title ellipsis bold">{name}</h5>
        </div>

        <div className="grid">
          <p className={`p3 ${rarity.toLowerCase()}`}>
            <i>{rarity}</i>
          </p>
          {description && <p className="p3">{description}</p>}
          {value && valueText && (
            <p className="p3">
              {valueText}: <span className="text-success">{value}</span>
            </p>
          )}
        </div>

        {!isReadyOnly && handlePurchase && (
          <>
            <p className="p3 text-muted">
              <i>Price: {cost}</i>
            </p>

            <div className="card-actions">
              <button
                className="btn btn-outline p3"
                onClick={() => handlePurchase(id)}
                disabled={(coinsAvailable ?? 0) < (cost ?? 0) || isPurchasing}
              >
                {isPurchasing ? "Purchasing..." : "Buy"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryItem;
