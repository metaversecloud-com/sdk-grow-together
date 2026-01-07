export const getSecondsRemaining = (lastWatered: string, growthTime: number, appliedTools: string[]) => {
  let updatedGrowthTime = growthTime;

  // Apply the highest growth speed boost if multiple mulches are present
  if (appliedTools.includes("Ultra Mulch")) {
    updatedGrowthTime = growthTime * (1 - 0.33);
  } else if (appliedTools.includes("Super Mulch")) {
    updatedGrowthTime = growthTime * (1 - 0.25);
  } else if (appliedTools.includes("Basic Mulch")) {
    updatedGrowthTime = growthTime * (1 - 0.1);
  }

  const lastWateredTime = new Date(lastWatered).getTime();
  const currentTime = new Date().getTime();
  const elapsedSeconds = (currentTime - lastWateredTime) / 1000;
  const remainingSeconds = Math.max(0, updatedGrowthTime - elapsedSeconds);
  return remainingSeconds <= 0 ? 0 : remainingSeconds;
};
