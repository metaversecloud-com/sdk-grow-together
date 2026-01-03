import { VisitorInterface } from "@rtsdk/topia";
import { Credentials, UserItems, VisitorInventoryItemType } from "../../types/index.js";
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
}) => {
  try {
    let item = {} as VisitorInventoryItemType;

    await visitor.fetchInventoryItems();
    const visitorInventoryItem = visitor.inventoryItems?.find((item) => item.name === name);

    if (visitorInventoryItem) {
      const updatedItem = await visitor.modifyInventoryItemQuantity(visitorInventoryItem, quantity);
      item.availableQuantity = updatedItem.quantity;
      item.quantity = updatedItem.quantity;
    } else {
      const getInventoryItemResponse = await getInventoryItem(credentials, name);
      if (getInventoryItemResponse instanceof Error) throw getInventoryItemResponse;

      const { inventoryItem, itemData } = getInventoryItemResponse;

      const newItem: UserItems = await visitor.grantInventoryItem(inventoryItem, quantity);
      item = {
        ...defaultVisitorInventoryItem,
        ...itemData,
        id: newItem.id,
        ecosystemItemId: newItem.item_id,
        availableQuantity: newItem.quantity || 0,
        description: newItem.description || itemData.description,
        icon: newItem.image_url || itemData.icon,
        name,
        quantity: newItem.quantity || 0,
      };
    }

    return item;
  } catch (error: any) {
    return standardizeError(error);
  }
};
