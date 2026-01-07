import { useContext, useState } from "react";

// components
import {
  DecorationMenu,
  InventoryDecorations,
  InventorySeeds,
  InventoryTools,
  ModalHeader,
  SeedMenu,
  ToolMenu,
  YourMoney,
} from "@/components";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const InventoryModal = ({
  showVisitorInventoryOnly,
  onClose,
}: {
  showVisitorInventoryOnly: boolean;
  onClose: () => void;
}) => {
  const { visitorInventory = { coins: 0 } } = useContext(GlobalStateContext);

  const [activeTab, setActiveTab] = useState("seeds");

  return (
    <div className="modal-container">
      <div className="modal">
        <ModalHeader text="Garden Store" disabled={false} handleOnClick={onClose} />

        <YourMoney coinsAvailable={visitorInventory.coins} />

        <div className="tab-text-container">
          <button
            className={`btn btn-text ${activeTab === "seeds" ? "active" : ""}`}
            onClick={() => setActiveTab("seeds")}
          >
            Seeds
          </button>
          <button
            className={`btn btn-text ${activeTab === "tools" ? "active" : ""}`}
            onClick={() => setActiveTab("tools")}
          >
            Tools
          </button>
          <button
            className={`btn btn-text ${activeTab === "decorations" ? "active" : ""}`}
            onClick={() => setActiveTab("decorations")}
          >
            Decorations
          </button>
        </div>

        {showVisitorInventoryOnly ? (
          activeTab === "seeds" ? (
            <InventorySeeds />
          ) : activeTab === "tools" ? (
            <InventoryTools />
          ) : (
            <InventoryDecorations />
          )
        ) : activeTab === "seeds" ? (
          <SeedMenu />
        ) : activeTab === "tools" ? (
          <ToolMenu />
        ) : (
          <DecorationMenu />
        )}
      </div>
    </div>
  );
};

export default InventoryModal;
