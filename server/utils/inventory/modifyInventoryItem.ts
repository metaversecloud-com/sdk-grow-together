import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, VisitorInventoryItemType } from "../../types/index.js";
import { getInventoryItem, standardizeError, structureVisitorInventoryItem } from "../index.js";

export const modifyVisitorInventoryItem = async ({
  credentials,
  visitor,
  id,
  name,
  quantity,
}: {
  credentials: Credentials;
  visitor: VisitorInterface;
  id?: string;
  name?: string;
  quantity: number;
}): Promise<VisitorInventoryItemType> => {
  try {
    const inventoryItem = await getInventoryItem(credentials, { id, name });

    const visitorItem = await visitor.modifyInventoryItemQuantity(inventoryItem, quantity);

    const itemData = await structureVisitorInventoryItem(visitorItem, credentials);

    return itemData;
  } catch (error: any) {
    throw standardizeError(error);
  }
};
