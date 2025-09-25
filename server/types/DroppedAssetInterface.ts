import { DroppedAsset } from "@rtsdk/topia";

export interface IDroppedAsset extends DroppedAsset {
  dataObject?: {
    droppedAssetCount?: number;
  };
}
