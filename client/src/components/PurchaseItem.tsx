interface PurchaseItemProps {
  coinsAvailable: number;
  id: number;
  available: boolean;
  imageSrc: string;
  name: string;
  description: string;
  rarity: string;
  cost: number;
  value: string;
  canPurchaseAdditional: boolean;
  isPurchasing: boolean;
  handlePurchase: (id: number) => void;
}

export const PurchaseItem = ({
  coinsAvailable,
  id,
  available,
  imageSrc,
  name,
  description,
  rarity,
  cost,
  value,
  canPurchaseAdditional,
  isPurchasing,
  handlePurchase,
}: PurchaseItemProps) => {
  return (
    <div key={id} className={`card ${!available ? "opacity-50" : ""}`}>
      <img className="mx-auto" src={imageSrc} />
      <div className="card-details">
        <h4 className="card-title">{name}</h4>

        <div className="card-description grid gap-3">
          <p className={`p3 ${rarity.toLowerCase()}`}>
            <i>{rarity}</i>
          </p>
          <p className="p3">{description}</p>
          <p className="p3 text-success">{value}</p>
        </div>

        <div className="card-actions">
          {available ? (
            <button className="btn btn-outline p3" onClick={() => handlePurchase(id)} disabled={isPurchasing}>
              {isPurchasing ? "Purchasing..." : `Buy (${cost} coins)`}
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
