import { Request, Response } from "express";
import { World, errorHandler, getCredentials } from "../utils/index.js";

export const handleFireToast = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { title, text } = req.body;

    const world = World.create(credentials.urlSlug, { credentials });
    await world.fireToast({
      title,
      text,
    });

    return res.json({ world, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleFireToast",
      message: "Error firing toast in world",
      req,
      res,
    });
  }
};
