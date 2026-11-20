const topiaMock = require("../mocks/@rtsdk/topia").__mock;

import express from "express";
import request from "supertest";

import router from "../routes.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
}

const baseCreds = {
  assetId: "asset-123",
  interactivePublicKey: process.env.INTERACTIVE_KEY,
  interactiveNonce: "nonce-xyz",
  visitorId: 1,
  urlSlug: "my-world",
};

// Mock the utils
jest.mock("../utils/index.js", () => ({
  errorHandler: jest.fn(),
  getCredentials: jest.fn(),
  getPlotAssets: jest.fn(),
  initializeVisitorData: jest.fn(),
  getInventoryItems: jest.fn(),
  DroppedAsset: {
    create: jest.fn(),
    get: jest.fn(),
  },
  User: {
    create: jest.fn(),
  },
}));

const mockUtils = jest.mocked(require("../utils/index.js"));

describe("routes", () => {
  beforeEach(() => {
    topiaMock.reset();
    jest.clearAllMocks();
  });

  test("GET /system/health returns status OK and env keys", async () => {
    const app = makeApp();
    let res = await request(app).get("/api/system/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("envs");
    expect(res.body.envs).toHaveProperty("NODE_ENV");
  });

  test("GET /game-state returns the player's own plot, inventory and admin status", async () => {
    const plotAssetData = { ownerId: "profile-123" };
    const plotAsset = { fetchDataObject: jest.fn().mockResolvedValue(plotAssetData) };
    const ownPlot = { updateDataObject: jest.fn().mockResolvedValue({}) };
    const visitor = {
      isAdmin: true,
      updateDataObject: jest.fn().mockResolvedValue({}),
      fetchVisitor: jest.fn().mockResolvedValue({}),
    };
    const plotData = { plotAssetId: baseCreds.assetId };
    const visitorData = { worlds: { [baseCreds.urlSlug]: plotData } };
    const visitorInventory = { xp: 40 };

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getPlotAssets.mockResolvedValue({ availablePlotAssetIds: ["plot-2", "plot-3"] });
    mockUtils.DroppedAsset.create.mockResolvedValue(plotAsset);
    mockUtils.DroppedAsset.get.mockResolvedValue(ownPlot);
    mockUtils.initializeVisitorData.mockResolvedValue({ visitor, visitorData, visitorInventory });
    mockUtils.getInventoryItems.mockResolvedValue({
      ecosystemAccessories: [],
      ecosystemDecorations: [],
      ecosystemSeeds: [],
      ecosystemTools: [],
    });

    const app = makeApp();
    const res = await request(app).get("/api/game-state").query(baseCreds);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      isAdmin: true,
      plotAssetData,
      plotData,
      visitorPlotAssetId: baseCreds.assetId,
      noOfAvailablePlots: 2,
      xp: 40,
    });
    expect(mockUtils.getCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        assetId: "asset-123",
        interactiveNonce: "nonce-xyz",
        urlSlug: "my-world",
        visitorId: "1", // Query params come as strings
      }),
    );
    expect(mockUtils.DroppedAsset.create).toHaveBeenCalledWith(baseCreds.assetId, baseCreds.urlSlug, {
      credentials: baseCreds,
    });
    expect(ownPlot.updateDataObject).toHaveBeenCalled();
  });

  test("GET /game-state answers through errorHandler when the plot asset can't be loaded", async () => {
    const mockError = new Error("Asset not found");

    mockUtils.getCredentials.mockReturnValue(baseCreds);
    mockUtils.getPlotAssets.mockResolvedValue({ availablePlotAssetIds: [] });
    mockUtils.DroppedAsset.create.mockRejectedValue(mockError);

    // Mock errorHandler to actually call res.status().json() to end the response
    mockUtils.errorHandler.mockImplementation(({ res }: any) => {
      if (res) {
        return res.status(500).json({ error: "Internal server error" });
      }
      return { status: 500, message: "error" };
    });

    const app = makeApp();
    const res = await request(app).get("/api/game-state").query(baseCreds);

    expect(res.status).toBe(500);
    expect(mockUtils.errorHandler).toHaveBeenCalledWith({
      error: mockError,
      functionName: "handleGetGameState",
      message: "Error getting game state",
      req: expect.any(Object),
      res: expect.any(Object),
    });
  }, 30000);
});
