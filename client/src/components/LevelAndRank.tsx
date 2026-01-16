import { useEffect, useState } from "react";
import { getLevelsAndRanks } from "@shared/index";

export const LevelAndRank = ({ xp = 0 }: { xp?: number }) => {
  const [level, setLevel] = useState(0);
  const [rank, setRank] = useState("");

  useEffect(() => {
    const getInfo = async () => {
      const { level, rank } = await getLevelsAndRanks(xp);

      setLevel(level);
      setRank(rank);
    };
    getInfo();
  }, [xp]);

  return (
    <div className="flex grid-cols-2">
      <span className="icon icon-sm mr-2">{level}</span>
      <p className="p2 pt-1">
        <strong>{rank}</strong>
      </p>
    </div>
  );
};

export default LevelAndRank;
