import { useState } from "react";
import { ModalHeader } from "@/components";

export const RemoveModal = ({
  title,
  message,
  handleCancelRemove,
  handleViewSquare,
  handleOnConfirm,
}: {
  title: string;
  message: string;
  handleCancelRemove: () => void;
  handleViewSquare: () => void;
  handleOnConfirm: () => void;
}) => {
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const onConfirm = async () => {
    setAreButtonsDisabled(true);
    await handleOnConfirm();
    handleCancelRemove();
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={title}
          disabled={areButtonsDisabled}
          handleOnClick={() => {
            handleCancelRemove();
          }}
        />
        <p>{message}</p>
        <div className="actions">
          <button id="viewSquare" className="btn btn-outline" onClick={handleViewSquare} disabled={areButtonsDisabled}>
            View Slot
          </button>
          <button className="btn btn-danger-outline" onClick={onConfirm} disabled={areButtonsDisabled}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveModal;
