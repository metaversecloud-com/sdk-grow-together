export const getEarnedMessage = (coinRewardAmount: number, xpRewardAmount: number, multiplier?: number) => {
  let earnedMessage;
  if (coinRewardAmount > 0) {
    earnedMessage = `+${coinRewardAmount} Coins`;
    if (multiplier && multiplier > 1) earnedMessage += ` (${multiplier}X Profit)`;
  }
  if (xpRewardAmount > 0) {
    earnedMessage = earnedMessage ? `${earnedMessage} and +${xpRewardAmount} XP` : `+${xpRewardAmount} XP`;
  }

  return earnedMessage;
};
