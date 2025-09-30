export type WorldDataObjectType = {
  claimedPlots: {
    [plotAssetId: string]: string | null; // profileId of owner
  };
};

export type PlotGridConfigType = {
  gridSize: 4; // 4x4 grid of squares
  squareSpacing: 100; // pixels between plot squares
  plotDimensions: {
    width: 400; // total plot width in world units
    height: 400; // total plot height in world units
  };
};
