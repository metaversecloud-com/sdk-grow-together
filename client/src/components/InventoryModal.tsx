import { useContext, useState } from "react";

// components
import {
  AccessoriesMenu,
  DecorationsMenu,
  VisitorAccessories,
  VisitorDecorations,
  VisitorSeeds,
  VisitorTools,
  ModalHeader,
  SeedsMenu,
  ToolsMenu,
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

        <div className="flex justify-between gap-2 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <button
            className={`p2 ${activeTab === "seeds" && "border-b border-gray-400"}`}
            style={{ minWidth: 0 }}
            onClick={() => setActiveTab("seeds")}
          >
            Seeds
          </button>
          <button
            className={`p2 ${activeTab === "tools" && "border-b border-gray-400"}`}
            style={{ minWidth: 0 }}
            onClick={() => setActiveTab("tools")}
          >
            Tools
          </button>
          <button
            className={`p2 ${activeTab === "decorations" && "border-b border-gray-400"}`}
            style={{ minWidth: 0 }}
            onClick={() => setActiveTab("decorations")}
          >
            Decorations
          </button>
          <button
            className={`p2 ${activeTab === "accessories" && "border-b border-gray-400"}`}
            style={{ minWidth: 0 }}
            onClick={() => setActiveTab("accessories")}
          >
            Accessories
          </button>
        </div>

        {showStore ? (
          activeTab === "seeds" ? (
            <SeedsMenu />
          ) : activeTab === "tools" ? (
            <ToolsMenu />
          ) : activeTab === "accessories" ? (
            <AccessoriesMenu />
          ) : (
            <DecorationsMenu />
          )
        ) : activeTab === "seeds" ? (
          <VisitorSeeds
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("seeds");
            }}
          />
        ) : activeTab === "tools" ? (
          <VisitorTools
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("tools");
            }}
          />
        ) : activeTab === "accessories" ? (
          <VisitorAccessories
            handleShowInventoryModal={() => {
              setShowStore(true);
              setActiveTab("accessories");
            }}
          />
        ) : (
          <VisitorDecorations
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
