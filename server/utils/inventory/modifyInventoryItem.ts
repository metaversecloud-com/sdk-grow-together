import { UserInterface, VisitorInterface } from "@rtsdk/topia";
import { Credentials } from "../../types/index.js";
import { getInventoryItem } from "./getInventoryItem.js";
import { standardizedError } from "../standardizedError.js";

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

export const modifyUserInventoryItem = async ({
  credentials,
  user,
  name,
  quantity,
}: {
  credentials: Credentials;
  user: UserInterface;
  name: string;
  quantity: number;
}) => {
  try {
    await user.fetchDataObject();

    await user.fetchInventoryItems();
    const userInventoryItem = user.inventoryItems?.find((item) => item.name === name);

    if (userInventoryItem) {
      await user.modifyInventoryItemQuantity(userInventoryItem, quantity);
    } else {
      const inventoryItem = await getInventoryItem(credentials, name);
      if (inventoryItem instanceof Error) throw inventoryItem;

      await user.grantInventoryItem(inventoryItem, quantity);
    }

    return { success: true };
  } catch (error: any) {
    return standardizedError(error);
  }
};
