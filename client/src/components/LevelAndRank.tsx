import { useEffect, useState } from "react";
import { getLevel, getRank } from "@shared/index";

export const LevelAndRank = ({ xp = 0 }: { xp?: number }) => {
  const [level, setLevel] = useState(0);
  const [rank, setRank] = useState("");

  useEffect(() => {
    const getInfo = async () => {
      const level = await getLevel(xp);
      const rank = await getRank(level);
      setLevel(level);
      setRank(rank);
    };
    getInfo();
  }, [xp]);

  return (
    <div className="flex grid-cols-2 gap-2">
      <span className="icon mr-2">{level}</span>
      <p className="pt-2">
        <strong>{rank}</strong>
      </p>
    </div>
  );
};

export default LevelAndRank;
