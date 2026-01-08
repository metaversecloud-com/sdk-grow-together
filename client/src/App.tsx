import { useContext, useEffect, useMemo, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

// pages
import { Error, Home, Plot, Crop, Decoration, Teleport } from "./pages";

// context
import { GlobalDispatchContext, GlobalStateContext } from "./context/GlobalContext";
import { InteractiveParams, SET_DID_LEVEL_UP, SET_HAS_INTERACTIVE_PARAMS, SET_SOUND_EFFECT } from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);
  const { soundEffect, didLevelUp } = useContext(GlobalStateContext);

  const interactiveParams: InteractiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId") || "",
      displayName: searchParams.get("displayName") || "",
      identityId: searchParams.get("identityId") || "",
      interactiveNonce: searchParams.get("interactiveNonce") || "",
      interactivePublicKey: searchParams.get("interactivePublicKey") || "",
      profileId: searchParams.get("profileId") || "",
      sceneDropId: searchParams.get("sceneDropId") || "",
      uniqueName: searchParams.get("uniqueName") || "",
      urlSlug: searchParams.get("urlSlug") || "",
      username: searchParams.get("username") || "",
      visitorId: searchParams.get("visitorId") || "",
    };
  }, [searchParams]);

  useEffect(() => {
    if (interactiveParams.assetId) {
      dispatch!({
        type: SET_HAS_INTERACTIVE_PARAMS,
        payload: { hasInteractiveParams: true },
      });
    }
  }, [interactiveParams]);

  useEffect(() => {
    if (!hasInitBackendAPI) setupBackend();
  }, [hasInitBackendAPI, interactiveParams]);

  useEffect(() => {
    let audio;
    if (soundEffect === "sprinkler") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/sprinkler.mp3");
      audio.volume = 0.7;
    } else if (soundEffect === "harvest") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/harvest_coins.mp3");
      audio.volume = 0.5;
    } else if (soundEffect === "water") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/water_plant.mp3");
      audio.volume = 0.5;
    } else if (soundEffect === "plant") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/crop_planted.mp3");
      audio.volume = 0.8;
    } else if (soundEffect === "mulch") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/mulch.mp3");
      audio.volume = 0.7;
    } else if (soundEffect === "compost") {
      audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/compost.mp3");
      audio.volume = 0.7;
    }
    if (audio) {
      audio.play();

      dispatch!({
        type: SET_SOUND_EFFECT,
        payload: { soundEffect: undefined },
      });
    }
  }, [soundEffect]);

  useEffect(() => {
    if (didLevelUp) {
      setTimeout(() => {
        const audio = new Audio("https://sdk-grow-together.s3.us-east-1.amazonaws.com/newLevel.mp3");
        audio.play();
      }, 1000);

      setTimeout(() => {
        dispatch!({
          type: SET_DID_LEVEL_UP,
          payload: { didLevelUp: false },
        });
      }, 5000);
    }
  }, [didLevelUp]);

  const setupBackend = () => {
    setupBackendAPI(interactiveParams)
      .catch((error) => {
        console.error(error?.response?.data?.message);
        navigate("*");
      })
      .finally(() => setHasInitBackendAPI(true));
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/teleport" element={<Teleport />} />
      <Route path="/plot" element={<Plot />} />
      <Route path="/crop" element={<Crop />} />
      <Route path="/decoration" element={<Decoration />} />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
