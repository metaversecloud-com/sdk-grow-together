export const getEarnedMessage = (coinRewardAmount: number, xpRewardAmount: number, multiplier?: number) => {
  let message;
  if (coinRewardAmount > 0) {
    message = `+${coinRewardAmount} Coins`;
  }
  if (xpRewardAmount > 0) {
    message = message ? `${message}, +${xpRewardAmount} XP` : `+${xpRewardAmount} XP`;
  }

  return {
    message,
    multiplier: multiplier === 2 ? "Double profit!" : multiplier === 3 ? "Triple profit!" : undefined,
  };
};
