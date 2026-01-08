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
          return { rank: "New Gardener", coinsEarned: 0 };
        case 2:
          return { rank: "Beginner Gardener", coinsEarned: 10 };
        case 3:
          return { rank: "Bronze Gardener", coinsEarned: 15 };
        case 4:
          return { rank: "Budding Gardener", coinsEarned: 20 };
        case 8:
          return { rank: "Sprout Scout", coinsEarned: 40 };
        case 10:
          return { rank: "Able Gardener", coinsEarned: 50 };
        case 12:
          return { rank: "Silver Gardener", coinsEarned: 65 };
        case 15:
          return { rank: "Fancy Gardener", coinsEarned: 75 };
        case 17:
          return { rank: "Skilled Gardener", coinsEarned: 85 };
        case 20:
          return { rank: "Certified Green Thumb", coinsEarned: 100 };
        case 22:
          return { rank: "Gold Gardener", coinsEarned: 110 };
        case 25:
          return { rank: "Splendid Gardener", coinsEarned: 125 };
        case 30:
          return { rank: "Expert Gardener", coinsEarned: 150 };
        case 32:
          return { rank: "Platinum Gardener", coinsEarned: 160 };
        case 35:
          return { rank: "Flourishing Gardener", coinsEarned: 175 };
        case 40:
          return { rank: "Hot Shot Gardener", coinsEarned: 200 };
        case 42:
          return { rank: "Diamond Gardener", coinsEarned: 210 };
        case 45:
          return { rank: "Genius Gardener", coinsEarned: 225 };
        case 50:
          return { rank: "Rockstar Gardener", coinsEarned: 250 };
        case 52:
          return { rank: "Emerald Gardener", coinsEarned: 260 };
        case 60:
          return { rank: "Harvest Hero", coinsEarned: 300 };
        case 67:
          return { rank: "Six Seven Gardener", coinsEarned: 335 };
        case 70:
          return { rank: "Leaf Legend", coinsEarned: 350 };
        case 80:
          return { rank: "Crop Whisperer", coinsEarned: 400 };
        case 90:
          return { rank: "Mythical Gardener", coinsEarned: 450 };
        case 100:
          return { rank: "Legendary Gardener", coinsEarned: 500 };
      }
    }
  }
  return { rank: "New Gardener", coinsEarned: 0 };
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
  const { rank } = await getRank(level);
  const percentage = await getPercentageOfCurrentLevelComplete(xp);

  return { level, rank, percentageOfCurrentLevelComplete: percentage };
};

export const getAllLevelsAndRanks = async () => {
  const allLevelsAndRanks = [];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const { rank, coinsEarned } = await getRank(levels[i]);
    allLevelsAndRanks.push({ level, rank, coinsEarned });
  }

  return allLevelsAndRanks;
};
