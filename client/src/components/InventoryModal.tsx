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
  inventoryModalActiveTab,
  showVisitorInventoryOnly,
  onClose,
}: {
  inventoryModalActiveTab?: string;
  showVisitorInventoryOnly: boolean;
  onClose: () => void;
}) => {
  const { visitorInventory = { coins: 0 } } = useContext(GlobalStateContext);

  const [activeTab, setActiveTab] = useState(inventoryModalActiveTab || "seeds");
  const [showStore, setShowStore] = useState(!showVisitorInventoryOnly);

  return (
    <div className="modal-container">
      <div className="modal" style={{ height: "70vh" }}>
        <ModalHeader
          text={`${showStore ? "Garden Store" : "Your Backpack"}`}
          disabled={false}
          handleOnClick={onClose}
        />

        <YourMoney coinsAvailable={visitorInventory.coins} />

        <div className="tab-text-container">
          <button
            className={`btn btn-text ${activeTab === "seeds" ? "active" : ""}`}
            style={{ width: "auto" }}
            onClick={() => setActiveTab("seeds")}
          >
            Seeds
          </button>
          <button
            className={`btn btn-text ${activeTab === "tools" ? "active" : ""}`}
            style={{ width: "auto" }}
            onClick={() => setActiveTab("tools")}
          >
            Tools
          </button>
          <button
            className={`btn btn-text ${activeTab === "decorations" ? "active" : ""}`}
            style={{ width: "auto" }}
            onClick={() => setActiveTab("decorations")}
          >
            Decorations
          </button>
        </div>

        {showStore ? (
          activeTab === "seeds" ? (
            <SeedMenu />
          ) : activeTab === "tools" ? (
            <ToolMenu />
          ) : (
            <DecorationMenu />
          )
        ) : activeTab === "seeds" ? (
          <InventorySeeds
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("seeds");
            }}
          />
        ) : activeTab === "tools" ? (
          <InventoryTools
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("tools");
            }}
          />
        ) : (
          <InventoryDecorations
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("decorations");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryModal;
