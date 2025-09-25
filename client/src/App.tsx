import { useContext, useEffect, useMemo, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";

// pages
import { Error, Home } from "./pages";

// context
import { GlobalDispatchContext } from "./context/GlobalContext";
import { InteractiveParams, SET_HAS_INTERACTIVE_PARAMS } from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

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
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
