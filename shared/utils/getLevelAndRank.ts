const levels = [1, 2, 3, 4, 8, 10, 12, 15, 17, 20, 22, 25, 30, 32, 35, 40, 42, 45, 50, 52, 60, 67, 70, 80, 90, 100];

const xpThresholds = [
  52.3, 65.2, 78.7, 92.8, 107.5, 122.8, 138.7, 155.2, 172.3, 190, 208.3, 227.2, 246.7, 266.8, 287.5, 308.8, 330.7,
  353.2, 376.3, 400, 424.3, 449.2, 474.7, 500.8, 527.5, 554.8, 582.7, 611.2, 640.3, 670, 700.3, 731.2, 762.7, 794.8,
  827.5, 860.8, 894.7, 929.2, 964.3, 1000, 1036.3, 1073.2, 1110.7, 1148.8, 1187.5, 1226.8, 1266.7, 1307.2, 1348.3, 1390,
  1432.3, 1475.2, 1518.7, 1562.8, 1607.5, 1652.8, 1698.7, 1745.2, 1792.3, 1840, 1888.3, 1937.2, 1986.7, 2036.8, 2087.5,
  2138.8, 2190.7, 2243.2, 2296.3, 2350, 2404.3, 2459.2, 2514.7, 2570.8, 2627.5, 2684.8, 2742.7, 2801.2, 2860.3, 2920,
  2980.3, 3041.2, 3102.7, 3164.8, 3227.5, 3290.8, 3354.7, 3419.2, 3484.3, 3550, 3616.3, 3683.2, 3750.7, 3818.8, 3887.5,
  3956.8, 4026.7, 4097.2, 4168.3, 4240,
];

export const getLevel = async (xp: number) => {
  let level = 0;
  for (let i = 0; i < xpThresholds.length; i++) {
    if (xp > xpThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

export const getRank = async (level: number) => {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (level >= levels[i]) {
      switch (levels[i]) {
        case 1:
          return "New Gardener";
        case 2:
          return "Beginner Gardener";
        case 3:
          return "Bronze Gardener";
        case 4:
          return "Budding Gardener";
        case 8:
          return "Sprout Scout";
        case 10:
          return "Able Gardener";
        case 12:
          return "Silver Gardener";
        case 15:
          return "Fancy Gardener";
        case 17:
          return "Skilled Gardener";
        case 20:
          return "Certified Green Thumb";
        case 22:
          return "Gold Gardener";
        case 25:
          return "Splendid Gardener";
        case 30:
          return "Expert Gardener";
        case 32:
          return "Platinum Gardener";
        case 35:
          return "Flourishing Gardener";
        case 40:
          return "Hot Shot Gardener";
        case 42:
          return "Diamond Gardener";
        case 45:
          return "Genius Gardener";
        case 50:
          return "Rockstar Gardener";
        case 52:
          return "Emerald Gardener";
        case 60:
          return "Harvest Hero";
        case 67:
          return "Six Seven Gardener";
        case 70:
          return "Leaf Legend";
        case 80:
          return "Crop Whisperer";
        case 90:
          return "Mythical Gardener";
        case 100:
          return "Legendary Gardener";
      }
    }
  }
  return "New Gardener";
};

export const getPercentageOfCurrentLevelComplete = async (xp: number, currentLevel?: number) => {
  let level = currentLevel || 0;

  if (!currentLevel) level = await getLevel(xp);

  const xpForNextLevel = xpThresholds[level] || xpThresholds[xpThresholds.length - 1];

  const percentageOfCurrentLevelComplete =
    level === 0
      ? (xp / xpThresholds[0]) * 100
      : ((xp - xpThresholds[level - 1]) / (xpForNextLevel - xpThresholds[level - 1])) * 100;

  return percentageOfCurrentLevelComplete;
};

export const getAllProgressInfo = async (xp: number) => {
  const level = await getLevel(xp);
  const rank = await getRank(level);
  const percentage = await getPercentageOfCurrentLevelComplete(xp);

  return { level, rank, percentageOfCurrentLevelComplete: percentage };
};

export const getAllLevelsAndRanks = async () => {
  const allLevelsAndRanks = [];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const rank = await getRank(levels[i]);
    allLevelsAndRanks.push({ level, rank });
  }

  return allLevelsAndRanks;
};
