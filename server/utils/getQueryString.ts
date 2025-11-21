import { Credentials } from "../types/Credentials.js";
import { errorHandler } from "./errorHandler.js";

export const getQueryString = (credentials: Credentials): string => {
  try {
    const { displayName, identityId, interactiveNonce, interactivePublicKey, profileId, urlSlug, username, visitorId } =
      credentials;

    return `displayName=${encodeURIComponent(displayName)}&identityId=${encodeURIComponent(identityId)}&interactiveNonce=${encodeURIComponent(interactiveNonce)}&interactivePublicKey=${encodeURIComponent(interactivePublicKey)}&profileId=${encodeURIComponent(profileId)}&urlSlug=${encodeURIComponent(urlSlug)}&username=${encodeURIComponent(username)}&visitorId=${encodeURIComponent(visitorId)}`;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getQueryString",
      message: "Error getting query string from credentials",
    });
  }
};
