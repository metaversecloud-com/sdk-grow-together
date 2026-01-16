import { ReactNode, useContext, useState } from "react";

// components
import { AdminView, AdminIconButton, Loading, InfoModal, LevelAndRank } from "@/components";

// context
import { GlobalStateContext } from "@context/GlobalContext";

export const PageContainer = ({
  children,
  isLoading,
  headerText,
  isOwnedByCurrentUser,
  xp,
}: {
  children: ReactNode;
  isLoading: boolean;
  headerText?: string;
  isOwnedByCurrentUser?: boolean;
  xp?: number;
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
        <div className="pb-6">
          <div className="flex">
            <h2 className="pr-4">{headerText}</h2>
            {isOwnedByCurrentUser && (
              <button className="btn btn-icon mr-2" onClick={() => setShowInfoModal(!showInfoModal)}>
                <img src={`https://sdk-style.s3.amazonaws.com/icons/info.svg`} />
              </button>
            )}
          </div>
          {isOwnedByCurrentUser && xp !== undefined && <LevelAndRank xp={xp} />}
        </div>
      )}

      {error && <p className="p3 pb-3 text-center text-error">{error}</p>}

      {showSettings ? <AdminView /> : children}

      {showInfoModal && <InfoModal xp={xp} setShowInfoModal={() => setShowInfoModal(!showInfoModal)} />}
    </div>
  );
};

export default PageContainer;
