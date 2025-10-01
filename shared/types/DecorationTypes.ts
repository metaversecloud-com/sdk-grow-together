/**
 * Shared decoration types between client and server
 */

export type DecorationType = {
  id: number;
  name: string;
  cost: number;
  icon: string;
  imageSrc: string;
};

export type PlacedDecorationType = {
  id: number;
  dateDropped: string;
};
