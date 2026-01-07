const levels = [1, 2, 3, 4, 8, 10, 12, 15, 17, 20, 22, 25, 30, 32, 35, 40, 42, 45, 50, 52, 60, 67, 70, 80, 90, 100];

export const getLevel = async (xp: number) => {
  // XP = 40 + (12 * level) + (0.3 * level^2)
  let level = 0;
  if (xp > 40) {
    // Use quadratic formula: 0.3*level^2 + 12*level + 40 - xp = 0
    // level = (-12 + sqrt(12^2 - 4*0.3*(40-xp))) / (2*0.3)
    const a = 0.3;
    const b = 12;
    const c = 40 - xp;
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      level = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a));
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

  // Calculate XP for current and next level
  const xpForCurrentLevel = 40 + 12 * level + 0.3 * level * level;
  const nextLevel = level + 1;
  const xpForNextLevel = 40 + 12 * nextLevel + 0.3 * nextLevel * nextLevel;

  const percentageOfCurrentLevelComplete =
    level === 0 ? (xp / xpForNextLevel) * 100 : ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

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
