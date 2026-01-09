import { VisitorInterface, WorldActivityType } from "@rtsdk/topia";
import { World } from "./topiaInit.js";
import { Credentials } from "../types/Credentials.js";
import { standardizeError } from "./standardizeError.js";
import { getLevelsAndRanks } from "../../shared/index.js";

export const checkDidIncreaseLevelOrRank = async (
  credentials: Credentials,
  visitor: VisitorInterface,
  previousXp: number = 0,
  xpRewardAmount: number = 0,
) => {
  const { assetId, urlSlug } = credentials;

  let coinsEarnedForRankUp = 0;

  const { level: previousLevel, rank: previousRank } = await getLevelsAndRanks(previousXp);
  const { level: currentLevel, rank: currentRank, coinsEarned } = await getLevelsAndRanks(previousXp + xpRewardAmount);

  const didLevelUp = currentLevel > previousLevel;
  const didRankUp = currentRank !== previousRank;

  if (didLevelUp || didRankUp) {
    let title = `Congrats! Your garden is level ${currentLevel}`;
    if (didRankUp) {
      title += `  and your rank is now ${currentRank}`;

      coinsEarnedForRankUp = coinsEarned;
      if (coinsEarnedForRankUp > 0) title += `. You earned ${coinsEarnedForRankUp} coins for your new rank!`;

      const world = await World.create(urlSlug, { credentials });
      await world
        .triggerActivity({ type: WorldActivityType.GAME_HIGH_SCORE, assetId })
        .catch((error) =>
          console.error(
            "Error triggering GAME_HIGH_SCORE activity in checkDidIncreaseLevelOrRank:",
            standardizeError(error),
          ),
        );
    }

    await visitor
      .fireToast({
        groupId: "handlePurchaseTool",
        title,
      })
      .catch((error) => {
        console.error("Error firing toast in checkDidIncreaseLevelOrRank:", standardizeError(error));
      });
  }

  return { coinsEarnedForRankUp, didLevelUp };
};
