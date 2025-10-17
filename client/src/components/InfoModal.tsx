import { ModalHeader } from "@/components";

export const InfoModal = ({ setShowInfoModal }: { setShowInfoModal: () => void }) => {
  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="How to Play" disabled={false} handleOnClick={setShowInfoModal} />

        <div className="grid gap-4">
          <p className="p2">Congratulations on starting your garden!</p>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">Get Seeds</h4>
              <p className="card-description p3">
                Some seeds are free while others cost coins. You start with 0 coins, so plant free seeds first and start
                harvesting to earn coins!
              </p>
            </div>
          </div>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">Plant & Water</h4>
              <p className="card-description p3">
                Plant seeds in your plot grid and see them added to your garden. Click on a plant to view it's details
                and water it.
              </p>
            </div>
          </div>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">Harvest & Earn</h4>
              <p className="card-description p3">
                When crops are fully grown, click on them and harvest for coins! Use your earnings to unlock more
                expensive seeds or buy decorations to beautify your garden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
