import { VisitorInterface, WorldActivityType } from "@rtsdk/topia";
import { getLevel, getRank } from "../../shared/index.js";
import { World } from "./topiaInit.js";
import { Credentials } from "../types/Credentials.js";
import { standardizeError } from "./standardizeError.js";

export const checkDidIncreaseLevelOrRank = async (
  credentials: Credentials,
  visitor: VisitorInterface,
  previousXp: number = 0,
  xpRewardAmount: number = 0,
) => {
  const { assetId, urlSlug } = credentials;

  let coinsEarnedForRankUp = 0;

  const previousLevel = await getLevel(previousXp);
  const currentLevel = await getLevel(previousXp + xpRewardAmount);
  const { rank: previousRank } = await getRank(previousLevel);
  const { rank: currentRank, coinsEarned } = await getRank(currentLevel);

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

  return coinsEarnedForRankUp;
};
