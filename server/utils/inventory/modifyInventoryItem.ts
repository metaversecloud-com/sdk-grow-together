import { VisitorInterface } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getInventoryItem } from "./getInventoryItem.js";
import { standardizedError } from "../standardizedError.js";

export const modifyInventoryItem = async ({
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
    let updatedQuantity;

    await visitor.fetchInventoryItems();
    const visitorInventoryItem = visitor.inventoryItems?.find((item) => item.name === name);

    if (visitorInventoryItem) {
      const updatedItem = await visitor.modifyInventoryItemQuantity(visitorInventoryItem, quantity);
      updatedQuantity = updatedItem.quantity;
    } else {
      const inventoryItem = await getInventoryItem(credentials, name);
      if (inventoryItem instanceof Error) throw inventoryItem;

      const newItem = await visitor.grantInventoryItem(inventoryItem, quantity);
      updatedQuantity = newItem.quantity;
    }

    return updatedQuantity;
  } catch (error: any) {
    return standardizedError(error);
  }
};
