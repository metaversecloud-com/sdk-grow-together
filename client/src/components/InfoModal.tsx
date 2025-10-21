import { Instructions, ModalHeader } from "@/components";

export const InfoModal = ({ setShowInfoModal }: { setShowInfoModal: () => void }) => {
  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="Learn how to Play" disabled={false} handleOnClick={setShowInfoModal} />

        <div className="grid gap-2 text-left">
          <p className="p2">
            Welcome, gardener! In Grow Together, you will plant, water, and harvest crops to earn coins. You can use
            coins to buy rare seeds and decorations from the Garden Store to show off to friends.
          </p>

          <Instructions />
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
