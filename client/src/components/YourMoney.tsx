export const YourMoney = ({ coinsAvailable }: { coinsAvailable: number }) => {
  return (
    <div className="card small">
      <div className="card-details text-center">
        <p className="card-title">
          <b>Your Money:</b> <span className="text-success">{coinsAvailable} Coins</span>
        </p>
      </div>
    </div>
  );
};
