/* eslint-disable camelcase */
export interface TileJsonInstance {
  tiles: string[];
  vector_layers: VectorLayer[];
  tilestats: TileStats;
}

export interface VectorLayer {
  id: string;
  geometry_type: string;
  fields: Array<any>;
}

export interface TileStats {
  layers: Array<TileStatsLayer>;
}

export interface TileStatsLayer {
  attributes: Array<TileStatsLayerAttribute>;
}

export interface TileStatsLayerAttribute {
  attribute: string;
  count: number;
  type: 'Number'; // TODO complete types
  min: number;
  max: number;
  avg: number;
  sum: number;
  sample: Array<number>;
}
