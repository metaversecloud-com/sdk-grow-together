import { useContext, useEffect, useState } from "react";

// components
import { InventoryItem, ModalHeader, NoItems } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { VisitorInventoryItemType } from "@shared/types";

interface UsePlotToolModalProps {
  actionType: string;
  numberOfCropsReady: number;
  handleShowInventoryModal?: (activeTab: string) => void;
  closeToolModal: () => void;
}

export const UsePlotToolModal = ({
  actionType,
  numberOfCropsReady,
  handleShowInventoryModal,
  closeToolModal,
}: UsePlotToolModalProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory = { tools: {} } } = useContext(GlobalStateContext);
  const tools = visitorInventory.tools as Record<string, VisitorInventoryItemType>;

  const [hasTools, setHasTools] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  useEffect(() => {
    const hasAvailableTools =
      tools &&
      Object.values(tools).some(
        (tool) => tool.quantity > 0 && tool.canBeUsedOnPlot === true && tool.actionType === actionType,
      );
    setHasTools(!!hasAvailableTools);
  }, [visitorInventory, tools, actionType]);

  const handleUseTool = async (tool: VisitorInventoryItemType) => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/plot/use-tool`, { tool })
      .then((response) => {
        setGameState(dispatch, response.data);
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
        closeToolModal();
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={
            !hasTools
              ? `No ${actionType === "Water" ? "sprinklers" : "harvest baskets"} purchased`
              : !numberOfCropsReady || numberOfCropsReady <= 0
                ? `No crops ready to ${actionType.toLowerCase()}`
                : `${actionType} ${numberOfCropsReady} crops?`
          }
          disabled={areButtonsDisabled}
          handleOnClick={() => {
            closeToolModal();
          }}
        />

        {!hasTools ? (
          <NoItems activeTab="tools" closeModal={closeToolModal} handleShowInventoryModal={handleShowInventoryModal!} />
        ) : (
          <div className="grid gap-2 grid-cols-2">
            {Object.values(tools)
              .filter((tool) => {
                return (
                  tools[tool.name]?.quantity > 0 && tool.canBeUsedOnPlot === true && tool.actionType === actionType
                );
              })
              .map((tool) => {
                const { id, name, description, rarity, quantity, icon } = tool;
                const canUse = numberOfCropsReady > 0;

                return (
                  <div
                    key={id}
                    className={areButtonsDisabled || !canUse ? "opacity-50" : "cursor-pointer"}
                    onClick={() => canUse && handleUseTool(tool)}
                  >
                    <InventoryItem
                      key={id}
                      id={id}
                      icon={icon}
                      name={name}
                      description={description}
                      rarity={rarity}
                      value={quantity}
                      valueText="Owned"
                      isReadyOnly={true}
                      showDescriptionTooltip={true}
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsePlotToolModal;
