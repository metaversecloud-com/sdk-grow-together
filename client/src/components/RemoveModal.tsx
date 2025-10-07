import { useState } from "react";

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
        <div className="modal-header flex gap-2 grid-cols-2">
          <h4 className="flex-grow text-left">{title}</h4>
          <button
            onClick={() => {
              handleCancelRemove();
            }}
          >
            <img src="https://sdk-style.s3.amazonaws.com/icons/x.svg" style={{ width: "10px" }} />
          </button>
        </div>
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
