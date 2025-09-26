import { SEED_CONFIGS } from "@shared/types/SeedConfig";

export interface SeedConfig {
  id: number;
  name: string;
  cost: number;
  reward: number;
  growthTime: number;
  icon: string;
}

export const getSeedConfig = (seedId: number): SeedConfig | null => {
  return SEED_CONFIGS[seedId] || null;
};

export const calculateGrowthLevel = (dateDropped: string, growthTime: number): number => {
  const currentTime = new Date().getTime();
  const plantedTime = new Date(dateDropped).getTime();
  const timeElapsed = (currentTime - plantedTime) / 1000; // Convert to seconds

  const growthLevel = Math.floor(timeElapsed / (growthTime / 10));
  return Math.min(growthLevel, 10); // Cap at level 10
};

export const calculateTimeRemaining = (
  dateDropped: string,
  growthTime: number,
  currentGrowLevel: number,
): string | null => {
  const plantedTime = new Date(dateDropped).getTime();
  const currentTime = new Date().getTime();
  const elapsedSeconds = (currentTime - plantedTime) / 1000;
  const timePerLevel = growthTime / 10;
  const timeForNextLevel = (currentGrowLevel + 1) * timePerLevel;
  const remainingSeconds = Math.max(0, timeForNextLevel - elapsedSeconds);

  if (remainingSeconds === 0 || currentGrowLevel >= 10) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  return `${minutes}m ${seconds}s`;
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};
