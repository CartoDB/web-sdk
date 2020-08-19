/* eslint-disable class-methods-use-this */

import { TileJsonInstance } from './TileJsonInstance';

export class TileJsonClient {
  public async getTilesetInfoFrom(url: string): Promise<TileJsonInstance> {
    // eg: https://bq1.cartocdn.com/tilesjson?t=cartobq.maps.ais_tileset
    const r = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });
    return parseFetchJSON(r);

    // return {
    //   tiles: [
    //     'https://bq1.cartocdn.com/bqtiler?y={y}&x={x}&z={z}&p=0_14_0_5458_0_8191_4000_1&t=cartobq.maps.ais_tileset',
    //     'https://bq2.cartocdn.com/bqtiler?y={y}&x={x}&z={z}&p=0_14_0_5458_0_8191_4000_1&t=cartobq.maps.ais_tileset',
    //     'https://bq3.cartocdn.com/bqtiler?y={y}&x={x}&z={z}&p=0_14_0_5458_0_8191_4000_1&t=cartobq.maps.ais_tileset',
    //     'https://bq4.cartocdn.com/bqtiler?y={y}&x={x}&z={z}&p=0_14_0_5458_0_8191_4000_1&t=cartobq.maps.ais_tileset'
    //   ],
    //   vector_layers: [
    //     {
    //       geometry_type: 'Polygon'
    //     }
    //   ]
    // };
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
