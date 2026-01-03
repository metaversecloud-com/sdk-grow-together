import express from "express";
import {
  handleClaimPlot,
  handleGetGameState,
  handleGetPlotSquareInfo,
  handlePurchaseSeed,
  handlePlantSeed,
  handleHarvestCrop,
  handleTeleportToPlot,
  handleWaterCrop,
  handlePlaceDecoration,
  handleRemoveDecoration,
  handleOpenPlotIframe,
  handleRemoveCrop,
  handlePurchaseDecoration,
  handleOpenPlotSquareIframe,
  handleClearPlot,
  handleClearAllPlots,
  handleTeleportToOpenPlot,
  handleUseTool,
  handlePurchaseTool,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const router = express.Router();
const SERVER_START_DATE = new Date();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
    },
  });
});

router.get("/game-state", handleGetGameState);
router.post("/teleport", handleTeleportToOpenPlot);

// admin routes
router.post("/admin/clear-plot", handleClearPlot);
router.post("/admin/clear-all-plots", handleClearAllPlots);

// plot routes
router.post("/plot/claim", handleClaimPlot);
router.post("/plot/teleport", handleTeleportToPlot);
router.post("/plot/view", handleOpenPlotIframe);
router.post("/square/view", handleOpenPlotSquareIframe);
router.get("/square", handleGetPlotSquareInfo);

// crop routes
router.post("/seed/purchase", handlePurchaseSeed);
router.post("/crop/drop", handlePlantSeed);
router.post("/crop/water", handleWaterCrop);
router.post("/crop/harvest", handleHarvestCrop);
router.post("/crop/use-tool", handleUseTool);
router.post("/crop/remove", handleRemoveCrop);

// decoration routes
router.post("/decoration/purchase", handlePurchaseDecoration);
router.post("/decoration/drop", handlePlaceDecoration);
router.post("/decoration/remove", handleRemoveDecoration);

// tool routes
router.post("/tool/purchase", handlePurchaseTool);

export default router;
