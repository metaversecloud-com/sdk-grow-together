import { useContext } from "react";

// context
import { GlobalStateContext } from "@/context/GlobalContext";

export const DroppedAssetDetails = () => {
  const { droppedAsset, hasInteractiveParams } = useContext(GlobalStateContext);

  return (
    <>
      <div className="max-w-screen-lg">
        {!hasInteractiveParams ? (
          <p>
            Edit an asset in your world and open the Links page in the Modify Asset drawer and add a link to your
            website or use &quot;http://localhost:3000&quot; for testing locally. You can also add assetId,
            interactiveNonce, interactivePublicKey, urlSlug, and visitorId directly to the URL as search parameters to
            use this feature.
          </p>
        ) : (
          <p className="my-4">Interactive parameters found, nice work!</p>
        )}
      </div>

      {droppedAsset?.id && (
        <div className="flex flex-col w-full items-start">
          <p className="mt-4 mb-2">
            You have successfully retrieved the dropped asset details for {droppedAsset.assetName}!
          </p>
          <img
            className="w-96 h-96 object-cover rounded-2xl my-4"
            alt="preview"
            src={droppedAsset.topLayerURL || droppedAsset.bottomLayerURL}
          />
        </div>
      )}
    </>
  );
};

export default DroppedAssetDetails;
