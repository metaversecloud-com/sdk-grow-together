export const ModalHeader = ({
  text,
  disabled,
  handleOnClick,
}: {
  text: string;
  disabled: boolean;
  handleOnClick: () => void;
}) => {
  return (
    <div className="modal-header flex gap-2 grid-cols-2">
      <h4 className="flex-grow text-left">{text}</h4>
      <button disabled={disabled} onClick={handleOnClick}>
        <img src="https://sdk-style.s3.amazonaws.com/icons/x.svg" style={{ width: "10px" }} />
      </button>
    </div>
  );
};
