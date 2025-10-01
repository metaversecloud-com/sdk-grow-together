/**
 * Calculate growth level based on time elapsed, seed growth time, and harvest level
 */
export const calculateGrowthLevel = (dateDropped: string, growthTime: number, harvestLevel: number): number => {
  const currentTime = new Date().getTime();
  const plantedTime = new Date(dateDropped).getTime();
  const timeElapsed = (currentTime - plantedTime) / 1000; // Convert to seconds

  const growthLevel = Math.floor(timeElapsed / (growthTime / harvestLevel));
  return Math.min(growthLevel, harvestLevel); // Cap at harvest level
};
