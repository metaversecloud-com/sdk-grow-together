// components
import { PageContainer } from "@/components";

export const GardenHome = () => {
  return (
    <PageContainer isLoading={false} headerText="Welcome to Garden Game">
      <div className="container grid gap-4">
        <h3>How to Play</h3>
        <div className="grid gap-4">
          <p className="p2">Welcome to the relaxing garden game! Here's how to get started:</p>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">1. Claim a Plot</h4>
              <p className="card-description p3">
                Find an empty plot in the world and click on it. Then click "Claim This Plot" to make it yours. You can
                only own one plot per account.
              </p>
            </div>
          </div>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">2. Get Seeds</h4>
              <p className="card-description p3">
                Some seeds are free while others cost coins. You start with 0 coins, so plant free seeds first and start
                harvesting to earn coins!
              </p>
            </div>
          </div>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">3. Plant & Wait</h4>
              <p className="card-description p3">
                Plant seeds in your 4x4 plot grid. Plants grow automatically over time.
              </p>
            </div>
          </div>

          <div className="card small">
            <div className="card-details">
              <h4 className="card-title">4. Harvest & Earn</h4>
              <p className="card-description p3">
                When plants are fully grown, click on them and harvest for coins! Use your earnings to unlock more
                expensive seeds.
              </p>
            </div>
          </div>
        </div>

        <div className="card success">
          <div className="card-details">
            <h4 className="card-title">Ready to Start?</h4>
            <p className="card-description p2">
              Look for plot assets in the world - they look like empty garden plots. Click on one to claim it and start
              your gardening journey!
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default GardenHome;
