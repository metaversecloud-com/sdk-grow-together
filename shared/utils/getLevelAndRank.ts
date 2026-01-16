import { xpLevelsAndRanks } from "../constants/index.js";

export const getLevelsAndRanks = (xp: number) => {
  // Get all XP thresholds as numbers and sort ascending
  const thresholds = Object.keys(xpLevelsAndRanks)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the largest threshold that is <= xp
  let closest = thresholds[0];
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      closest = thresholds[i];
    } else {
      break;
    }
  }
  return { key: closest, ...xpLevelsAndRanks[closest.toString()] };
};

export const getPercentageOfCurrentLevelComplete = async (xp: number) => {
  const { key: xpKey } = getLevelsAndRanks(xp);

  const currentXpIndex = Object.keys(xpLevelsAndRanks).findIndex((key) => key === xpKey.toString());
  const nextXpIndex = currentXpIndex + 1;
  const nextXpThreshold = Number(Object.keys(xpLevelsAndRanks)[nextXpIndex]);
  const xpForNextLevel = nextXpThreshold - xp;
  const difBetweenLevels = nextXpThreshold - xpKey;

  const percentageOfCurrentLevelComplete = ((difBetweenLevels - xpForNextLevel) / difBetweenLevels) * 100;

  return percentageOfCurrentLevelComplete;
};

export const getAllLevelsAndRanks = async () => {
  const allLevelsAndRanks = [];
  for (const key in xpLevelsAndRanks) {
    const { level, rank, coinsEarned } = xpLevelsAndRanks[key];
    if (coinsEarned) allLevelsAndRanks.push({ level, rank, coinsEarned });
  }

  allLevelsAndRanks.sort((a, b) => a.level - b.level);

  return allLevelsAndRanks;
};
