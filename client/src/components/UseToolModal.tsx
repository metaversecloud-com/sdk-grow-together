import { useContext, useEffect, useState } from "react";

// components
import { InventoryItem, ModalHeader } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";
import { VisitorInventoryItemType } from "@shared/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

interface UseToolModalProps {
  itemAssetId?: string;
  selectedSquareId: number;
  ownerId?: string;
  isOwnedByCurrentUser?: boolean;
  isReadyToWater?: boolean;
  appliedTools: string[];
  closeToolModal: () => void;
  closeSquareModal?: () => void;
}

export const UseToolModal = ({
  itemAssetId,
  selectedSquareId,
  ownerId,
  isOwnedByCurrentUser,
  isReadyToWater,
  appliedTools,
  closeToolModal,
  closeSquareModal,
}: UseToolModalProps) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitorInventory = { tools: {} } } = useContext(GlobalStateContext);
  const tools = visitorInventory.tools as Record<string, VisitorInventoryItemType>;

  const [availableTools, setAvailableTools] = useState<VisitorInventoryItemType[]>([]);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  useEffect(() => {
    const validTools = [];
    for (const tool of Object.values(tools)) {
      const { actionType, canBeUsedOnPlot, quantity } = tool;
      if (
        quantity > 0 &&
        canBeUsedOnPlot === false &&
        (actionType !== "Water" || (actionType === "Water" && !isOwnedByCurrentUser))
      ) {
        validTools.push(tool);
      }
    }
    // const sortedTools = Object.values(validTools).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    setAvailableTools(validTools);
  }, [visitorInventory, tools]);

  const handleUseTool = async (tool: VisitorInventoryItemType) => {
    setAreButtonsDisabled(true);
    await backendAPI
      .post(`/crop/use-tool`, {
        itemAssetId,
        squareId: selectedSquareId,
        tool,
        ownerId,
      })
      .then((response) => {
        setGameState(dispatch, response.data);
        closeToolModal();
        closeSquareModal?.();
      })
      .catch((error) => {
        setErrorMessage(dispatch, error as ErrorType);
      })
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader
          text={`Use Tool on Slot ${selectedSquareId}`}
          disabled={areButtonsDisabled}
          handleOnClick={() => {
            closeToolModal();
          }}
        />

        {availableTools.length === 0 ? (
          <>
            <h4>No tools purchased.</h4>
            <p>Click "View Store" in the garden store to purchase more tools.</p>
          </>
        ) : (
          <div className="grid gap-2 grid-cols-2">
            {availableTools.map((tool) => {
              const { id, name, rarity, quantity, icon, actionType } = tool;
              const canUse =
                (actionType && actionType !== "Water" && !appliedTools?.some((tool) => tool.includes(actionType))) ||
                (isReadyToWater && actionType === "Water");
              const tooltipText =
                actionType === "Water" && !isReadyToWater
                  ? "Crop not ready to be watered yet."
                  : actionType && appliedTools?.some((tool) => tool.includes(actionType))
                    ? "Tool already used."
                    : null;

              return (
                <div key={id} className={`${tooltipText ? "tooltip-secondary" : ""}`} style={{ maxWidth: "100%" }}>
                  <span className="tooltip-content tooltip-secondary-content">{tooltipText}</span>
                  <div
                    className={areButtonsDisabled || !canUse ? "opacity-50" : "cursor-pointer"}
                    onClick={() => canUse && handleUseTool(tool)}
                  >
                    <InventoryItem
                      key={id}
                      id={id}
                      icon={icon}
                      name={name}
                      rarity={rarity}
                      value={quantity}
                      valueText="Owned"
                      isReadyOnly={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UseToolModal;
