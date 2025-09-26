export interface WorldDataObject {
  [sceneDropId: string]: string; // Maps sceneDropId to assetId
}

export interface PlotGridConfig {
  gridSize: 4; // 4x4 grid of squares
  squareSpacing: 100; // pixels between plot squares
  plotDimensions: {
    width: 400; // total plot width in world units
    height: 400; // total plot height in world units
  };
}
