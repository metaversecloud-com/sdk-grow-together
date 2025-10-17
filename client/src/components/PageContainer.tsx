import { ReactNode, useContext, useState } from "react";

// components
import { AdminView, AdminIconButton, Loading, InfoModal } from "@/components";

// context
import { GlobalStateContext } from "@context/GlobalContext";

export const PageContainer = ({
  children,
  isLoading,
  headerText,
  showInfoIcon,
}: {
  children: ReactNode;
  isLoading: boolean;
  headerText?: string;
  showInfoIcon?: boolean;
}) => {
  const { error, isAdmin } = useContext(GlobalStateContext);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  if (isLoading) return <Loading />;

  return (
    <div className="p-4 mb-18">
      {isAdmin && (
        <AdminIconButton setShowSettings={() => setShowSettings(!showSettings)} showSettings={showSettings} />
      )}
      {headerText && (
        <div className="flex pb-6">
          <h2 className="flex-grow">{headerText}</h2>
          {showInfoIcon && (
            <button className="btn btn-icon" onClick={() => setShowInfoModal(!showInfoModal)}>
              <img src={`https://sdk-style.s3.amazonaws.com/icons/info.svg`} />
            </button>
          )}
        </div>
      )}
      {showSettings ? <AdminView /> : children}
      {error && <p className="p3 pt-10 text-center text-error">{error}</p>}

      {showInfoModal && <InfoModal setShowInfoModal={() => setShowInfoModal(!showInfoModal)} />}
    </div>
  );
};

export default PageContainer;
