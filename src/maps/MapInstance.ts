export interface MapInstance {
  layergroupid: string;
  // eslint-disable-next-line camelcase
  last_updated: string;
  metadata: {
    layers: [
      {
        type: string;
        id: string;
        meta: {
          stats: {
            estimatedFeatureCount: number;
            geometryType: string;
            // TODO: create a proper type for columns
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            columns: any;
            sample: number[];
          };
          aggregation: {
            png: boolean;
            mvt: boolean;
          };
        };
        tilejson: {
          vector: {
            tilejson: string;
            tiles: string[];
          };
        };
      }
    ];
    dataviews: {
      [dataview: string]: {
        url: {
          http: string;
          https: string;
        };
      };
    };
    tilejson: {
      vector: {
        tilejson: string;
        tiles: string[];
      };
    };
    url: {
      vector: {
        urlTemplate: string;
        subdomains: string[];
      };
    };
  };
  // eslint-disable-next-line camelcase
  cdn_url: {
    http: string;
    https: string;
    templates: {
      http: {
        subdomains: string[];
        url: string;
      };
      https: {
        subdomains: string[];
        url: string;
      };
    };
  };
}
