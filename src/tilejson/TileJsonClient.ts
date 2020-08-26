/* eslint-disable class-methods-use-this */

import { TileJsonInstance } from './TileJsonInstance';

export class TileJsonClient {
  public async getTilesetInfoFrom(url: string): Promise<TileJsonInstance> {
    // eg: https://bq1.cartocdn.com/tilesjson?t=cartobq.maps.ais_tileset
    const r = await fetch(url);
    return parseFetchJSON(r);
  }
}

function parseFetchJSON(r: Response) {
  switch (r.status) {
    case 200:
      return r.json();
    case 404:
      throw new Error('Not found tilejson for that url');
    default:
      throw new Error('Unexpected error fetching the tileset info');
  }
}
