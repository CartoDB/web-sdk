/* eslint-disable camelcase */

export interface VectorLayer {
  geometry_type: string;
}

export interface TileJsonInstance {
  tiles: string[];
  vector_layers: VectorLayer[];
}
