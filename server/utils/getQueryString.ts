import { Credentials } from "../types/Credentials.js";
import { errorHandler } from "./errorHandler.js";

export const getQueryString = (credentials: Credentials): string => {
  try {
    const { displayName, identityId, interactiveNonce, interactivePublicKey, profileId, urlSlug, username, visitorId } =
      credentials;

    return encodeURIComponent(
      `displayName=${displayName}&identityId=${identityId}&interactiveNonce=${interactiveNonce}&interactivePublicKey=${interactivePublicKey}&profileId=${profileId}&urlSlug=${urlSlug}&username=${username}&visitorId=${visitorId}`,
    );
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getQueryString",
      message: "Error getting query string from credentials",
    });
  }
};
