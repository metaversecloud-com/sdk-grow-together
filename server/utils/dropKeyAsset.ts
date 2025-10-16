import { DroppedAsset, Asset, getBaseUrl, standardizedError } from "../utils/index.js";
import { Credentials } from "../types/index.js";
import { DroppedAssetClickType } from "@rtsdk/topia";
import { s3URL } from "../../shared/index.js";

export const dropKeyAsset = async ({
  credentials,
  hostname,
  position,
}: {
  credentials: Credentials;
  hostname: string;
  position: { x: number; y: number };
}) => {
  try {
    const asset = Asset.create("webImageAsset", { credentials });
    const baseUrl = getBaseUrl(hostname);
    const droppedSignAsset = await DroppedAsset.drop(asset, {
      clickType: DroppedAssetClickType.LINK,
      clickableLink: `${baseUrl}/plot`,
      clickableLinkTitle: "Open Plot",
      isInteractive: true,
      interactivePublicKey: credentials.interactivePublicKey,
      isOpenLinkInDrawer: true,
      layer1: `${s3URL}/Open-Plot-Sign.png`,
      position,
      uniqueName: `GrowTogether_plot`,
      urlSlug: credentials.urlSlug,
    });

    return {
      success: true,
      droppedSignAsset,
    };
  } catch (error: any) {
    return standardizedError(error);
  }
};
