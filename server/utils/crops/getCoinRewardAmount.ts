export const getCoinRewardAmount = (
  appliedTools: string[] = [],
  reward: number = 0,
): { coinRewardAmount: number; coinMultiplier: number } => {
  let coinMultiplier = 1;

  // Apply compost multipliers based on chance for each tool
  const composts = [
    {
      name: "Ultra Compost",
      doubleChance: 0.5,
      tripleChance: 0.25,
    },
    {
      name: "Super Compost",
      doubleChance: 0.33,
      tripleChance: 0.1,
    },
    {
      name: "Basic Compost",
      doubleChance: 0.25,
      tripleChance: 0.05,
    },
  ];

  // If multiple composts are present, apply the best one
  let bestCompost = null;
  for (const compost of composts) {
    if (appliedTools.includes(compost.name)) {
      if (!bestCompost || compost.doubleChance > bestCompost.doubleChance) {
        bestCompost = compost;
      }
    }
  }
  if (bestCompost) {
    const rand = Math.random();
    if (rand < bestCompost.tripleChance) {
      coinMultiplier = 3;
    } else if (rand < bestCompost.tripleChance + bestCompost.doubleChance) {
      coinMultiplier = 2;
    }
  }

  return { coinRewardAmount: reward * coinMultiplier, coinMultiplier };
};
