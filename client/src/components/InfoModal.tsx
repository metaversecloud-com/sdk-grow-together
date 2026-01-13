import { useEffect, useState } from "react";
import { Accordion, Instructions, LevelAndRank, ModalHeader } from "@/components";
import { getAllLevelsAndRanks, getPercentageOfCurrentLevelComplete } from "@shared/index";

export const InfoModal = ({ xp = 0, setShowInfoModal }: { xp?: number; setShowInfoModal: () => void }) => {
  const [activeTab, setActiveTab] = useState(xp > 0 ? "rank" : "instructions");
  const [percentageOfCurrentLevelComplete, setPercentageOfCurrentLevelComplete] = useState(0);
  const [allLevelsAndRanks, setAllLevelsAndRanks] = useState<{ level: number; rank: string; coinsEarned: number }[]>(
    [],
  );

  useEffect(() => {
    const getInfo = async () => {
      await getPercentageOfCurrentLevelComplete(xp).then((percentageOfCurrentLevelComplete) => {
        setPercentageOfCurrentLevelComplete(percentageOfCurrentLevelComplete);
      });

      const levelsAndRanks = await getAllLevelsAndRanks();
      setAllLevelsAndRanks(levelsAndRanks);
    };
    getInfo();
  }, [xp]);

  return (
    <div className="modal-container">
      <div className="modal" style={{ height: "70vh" }}>
        <ModalHeader text="Garden Details" disabled={false} handleOnClick={setShowInfoModal} />

        {xp > 0 ? (
          <div className="tab-text-container">
            <button
              className={`btn btn-text whitespace-nowrap ${activeTab === "rank" ? "active" : ""}`}
              onClick={() => setActiveTab("rank")}
            >
              Garden Rank
            </button>
            <button
              className={`btn btn-text whitespace-nowrap ${activeTab === "instructions" ? "active" : ""}`}
              onClick={() => setActiveTab("instructions")}
            >
              How To Play
            </button>
          </div>
        ) : null}

        {activeTab === "rank" ? (
          <>
            {xp > 0 && (
              <div className="grid gap-4 text-left">
                <div className="grid gap-2 py-2">
                  <h4>Your Rank</h4>
                  <LevelAndRank xp={xp} />
                </div>
                <div className="grid gap-2">
                  <h4>Next Level</h4>
                  <div className="h-5 overflow-hidden box-content rounded-full border border-gray-400">
                    <div
                      className="h-5 rounded-r-full progress"
                      style={{ width: `${percentageOfCurrentLevelComplete}%` }}
                    />
                  </div>
                  <p className="p3">Plant, water, and harvest crops to earn more XP.</p>
                </div>

                <Accordion title="All Ranks">
                  {Object.values(allLevelsAndRanks).map(({ level, rank, coinsEarned }, index) => (
                    <div key={index} className="flex gap-2 items-center text-left" style={{ marginLeft: "-7px" }}>
                      <div className="icon icon-sm shrink">{level}</div>
                      <div className="p2 pt-1 stretch whitespace-nowrap">
                        <strong>{rank}</strong>
                      </div>
                      {coinsEarned > 0 && <div className="p3 pt-1 truncate">+{coinsEarned} coins</div>}
                    </div>
                  ))}
                </Accordion>
              </div>
            )}
          </>
        ) : (
          <div className="grid gap-2 text-left">
            <p className="p2">
              Welcome, gardener! In Grow Together, you will plant, water, and harvest crops to earn coins. You can use
              coins to buy rare seeds and decorations from the Garden Store to show off to friends.
            </p>
            <Instructions />
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModal;
