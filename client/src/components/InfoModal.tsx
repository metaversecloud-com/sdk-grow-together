import { ModalHeader } from "@/components";

export const InfoModal = ({ setShowInfoModal }: { setShowInfoModal: () => void }) => {
  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="How to Play" disabled={false} handleOnClick={setShowInfoModal} />

        <div className="grid gap-4">
          <p className="p2">Welcome to the relaxing garden game! Here's how to get started:</p>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">1. Claim a Plot</h4>
              <p className="card-description p3">
                Find an empty plot in the world and click on it. Then click "Claim This Plot" to make it yours. You can
                only own one plot per account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
