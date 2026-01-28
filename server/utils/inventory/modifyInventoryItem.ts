import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, VisitorInventoryItemType } from "../../types/index.js";
import { getInventoryItem, standardizeError, structureVisitorInventoryItem } from "../index.js";

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
    const getInventoryItemResponse = await getInventoryItem(credentials, name);
    if (getInventoryItemResponse instanceof Error) throw getInventoryItemResponse;

    const inventoryItem = getInventoryItemResponse;

    const visitorItem = await visitor.modifyInventoryItemQuantity(inventoryItem, quantity);

    const itemData = await structureVisitorInventoryItem(visitorItem);

    return itemData;
  } catch (error: any) {
    return standardizeError(error);
  }
};
