export const NoItems = ({
  activeTab,
  closeModal,
  handleShowInventoryModal,
}: {
  activeTab?: string;
  closeModal?: () => void;
  handleShowInventoryModal: (activeTab: string) => void;
}) => {
  return (
    <>
      <p>
        <a
          className="cursor-pointer text-blue-500"
          onClick={() => {
            closeModal?.();
            handleShowInventoryModal(activeTab || "");
          }}
        >
          Click here
        </a>{" "}
        to open the store and buy more.
      </p>
    </>
  );
};
