interface InventoryItemProps {
  coinsAvailable?: number;
  icon: string;
  name: string;
  description?: string;
  rarity: string;
  cost?: number;
  value?: number;
  valueText?: string;
  quantity?: number;
  isPurchasing?: boolean;
  isReadyOnly?: boolean;
  showDescriptionTooltip?: boolean;
  handlePurchase?: (id: string) => void;
}

export const InventoryItem = ({
  coinsAvailable,
  icon,
  name,
  description,
  rarity = "Common",
  cost,
  value,
  valueText,
  quantity,
  isPurchasing,
  isReadyOnly,
  showDescriptionTooltip,
  handlePurchase,
}: InventoryItemProps) => {
  return (
    <div key={name} className="card menu-card">
      {showDescriptionTooltip && (
        <div className="tooltip" style={{ position: "absolute", margin: "-5px" }}>
          <span className="tooltip-content" style={{ width: "125px", left: "60px" }}>
            {description}
          </span>
          <div className="icon icon-sm" style={{ padding: 0 }}>
            <img src={`https://sdk-style.s3.amazonaws.com/icons/info.svg`} style={{ width: "14px" }} />
          </div>
        </div>
      )}

      <img className="mx-auto" src={icon} style={{ width: "40px" }} />
      <div className="card-details">
        <div className="tooltip" style={{ maxWidth: "100%" }}>
          <span className="tooltip-content">{name}</span>
          <h6 className="card-title ellipsis bold">{name}</h6>
        </div>

        <div className="grid">
          <p className={`p3 ${rarity.toLowerCase()}`}>
            <i>{rarity}</i>
          </p>
          {!showDescriptionTooltip && description && <p className="p3 truncate">{description}</p>}
          {valueText && (
            <p className="p3">
              {valueText}
              {value && `: `}
              <span className="text-success">{value}</span>
            </p>
          )}
        </div>

        {!isReadyOnly && handlePurchase && (
          <>
            <p className="p3 text-muted">
              <i>
                Price{quantity ? ` for ${quantity}` : ""}: {cost}
              </i>
            </p>

            <div className="card-actions">
              <button
                className="btn btn-outline p3"
                onClick={() => handlePurchase(name)}
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
