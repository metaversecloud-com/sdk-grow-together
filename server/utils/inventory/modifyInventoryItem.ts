import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, VisitorInventoryItemType } from "../../types/index.js";
import { getInventoryItem } from "./getInventoryItem.js";
import { standardizeError } from "../standardizeError.js";
import { defaultVisitorInventoryItem } from "../../../shared/index.js";

export const modifyVisitorInventoryItem = async ({
  credentials,
  visitor,
  name,
  quantity,
}: {
  credentials: Credentials;
  visitor: VisitorInterface;
  name: string;
  quantity: number;
}): Promise<VisitorInventoryItemType | Error> => {
  try {
    let item = {} as VisitorInventoryItemType;

    const getInventoryItemResponse = await getInventoryItem(credentials, name);
    if (getInventoryItemResponse instanceof Error) throw getInventoryItemResponse;

    const { inventoryItem, itemData } = getInventoryItemResponse;

    const newItem = await visitor.grantInventoryItem(inventoryItem, quantity);
    item = {
      ...defaultVisitorInventoryItem,
      ...itemData,
      id: newItem.id,
      availableQuantity: newItem.quantity || 0,
    };

    return item;
  } catch (error: any) {
    return standardizeError(error);
  }
};
