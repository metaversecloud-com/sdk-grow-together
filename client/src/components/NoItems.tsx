export const NoItems = ({
  type,
  activeTab,
  closeModal,
  handleShowInventoryModal,
}: {
  type: string;
  activeTab: string;
  closeModal: () => void;
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  return (
    <>
      <h4>No {type} purchased.</h4>
      <p>
        <a
          className="cursor-pointer text-blue-500"
          onClick={() => {
            closeModal();
            handleShowInventoryModal(activeTab);
          }}
        >
          Click here
        </a>{" "}
        to open the store and buy more.
      </p>
    </>
  );
};
