export const getSecondsRemaining = (lastWatered: string, growthTime: number) => {
  const lastWateredTime = new Date(lastWatered).getTime();
  const currentTime = new Date().getTime();
  const elapsedSeconds = (currentTime - lastWateredTime) / 1000;
  const remainingSeconds = Math.max(0, growthTime - elapsedSeconds);
  return remainingSeconds <= 0 ? 0 : remainingSeconds;
};
