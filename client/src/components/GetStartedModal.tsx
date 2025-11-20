import { ModalHeader } from "@/components";
import { s3URL } from "@shared/constants";

export const GetStartedModal = ({ setShowGetStartedModal }: { setShowGetStartedModal: () => void }) => {
  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="Start planting!" disabled={false} handleOnClick={setShowGetStartedModal} />
        <div className="grid gap-2 text-left">
          <p className="p2">
            You already have carrot seeds. Click the <b>green plus (+) button</b> below "Crops" and{" "}
            <b>select a carrot</b> seed to plant it.
          </p>

          <img src={`${s3URL}/getStarted1.jpg`} alt="Getting Started" />

          <p className="p2">
            After 1 minute, you'll need to water your carrots. <b>Click a carrot</b> and then{" "}
            <b>click the "Water" button.</b>
          </p>

          <img src={`${s3URL}/getStarted2.jpg`} alt="Getting Started" />

          <p className="p2">
            You'll then be able to harvest your carrots to earn coins! Save up coins to purchase new seeds and
            decorations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStartedModal;
