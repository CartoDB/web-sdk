import { Credentials, defaultCredentials, setDefaultCredentials } from '@/auth';
import { Client } from '@/maps/Client';
import { DatasetSource } from '../DatasetSource';

const TEST_CREDENTIALS = {
  username: 'test_username',
  apiKey: 'default_public',
  serverUrlTemplate: 'https://{user}.example.com'
};

const DEFAULT_DATASET = 'default_dataset';

describe('DatasetSource', () => {
  describe('Source creation', () => {
    it('should create a new Layer instance properly', () => {
      expect(() => new DatasetSource(DEFAULT_DATASET)).not.toThrow();
    });
  });

  describe('Credentials', () => {
    beforeEach(() => {
      setDefaultCredentials({ ...TEST_CREDENTIALS });
    });

    it('should use provided credentials', () => {
      const credentials = new Credentials(
        'not_default_username',
        'not_default_apikey',
        'https://notdefaultserver.com'
      );

      const source = new DatasetSource(DEFAULT_DATASET, { credentials });
      expect(source.credentials).toBe(credentials);
    });

    it('should use default credentials if not provided', () => {
      const source = new DatasetSource(DEFAULT_DATASET);
      expect(source.credentials).toBe(defaultCredentials);
    });
  });

  describe('Instantiation fails', () => {
    beforeEach(() => {
      setDefaultCredentials({ ...TEST_CREDENTIALS });

      Client.prototype.instantiateMapFrom = jest.fn().mockImplementation(() => {
        throw new Error('Error fake');
      });
    });

    it('should fail with error in instantiation', async () => {
      const source = new DatasetSource(DEFAULT_DATASET);

      expect(async () => {
        await source.init({ sample: new Set(), aggregation: new Set() });
      }).rejects.toEqual(new Error('Error fake'));
    });
  });

  describe('mapConfig', () => {
    let instantiateMapFromMock: any;

    beforeEach(() => {
      setDefaultCredentials({ ...TEST_CREDENTIALS });

      instantiateMapFromMock = jest.fn().mockImplementation(() => {
        return {
          metadata: {
            url: {
              vector: {
                urlTemplate: '{s}.carto.com',
                subdomains: []
              }
            },
            layers: [
              {
                meta: {
                  stats: {
                    geometryType: 'Point',
                    columns: {
                      column1: {
                        type: 'string',
                        categories: []
                      },
                      column2: {
                        type: 'string',
                        categories: []
                      }
                    }
                  }
                }
              }
            ]
          }
        };
      });
      Client.prototype.instantiateMapFrom = instantiateMapFromMock;
    });

    it('should have default mapConfig', async () => {
      const source = new DatasetSource(DEFAULT_DATASET);
      await source.init({ sample: new Set(), aggregation: new Set() });

      const expectedmapConfig = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 2048,
        bufferSize: {
          mvt: 10
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 32768,
            includeNulls: true
          },
          dimensions: true,
          sample: {
            num_rows: 1000,
            include_columns: []
          }
        },
        aggregation: {
          columns: {},
          dimensions: {},
          placement: 'centroid',
          resolution: 1,
          threshold: 1
        },
        sql: `SELECT * FROM ${DEFAULT_DATASET}`
      };

      expect(instantiateMapFromMock.mock.calls[0][0]).toStrictEqual(expectedmapConfig);
    });

    it('should overwrite default mapConfig with custom paramters', async () => {
      const mapOptions = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 512,
        bufferSize: {
          mvt: 30
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 5,
            includeNulls: false
          }
        },
        aggregation: {
          placement: 'centroid',
          resolution: 2,
          threshold: 2
        }
      };

      const source = new DatasetSource(DEFAULT_DATASET, { mapOptions });
      await source.init({ sample: new Set(), aggregation: new Set() });

      const expectedmapConfig = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 512,
        bufferSize: {
          mvt: 30
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 5,
            includeNulls: false
          },
          dimensions: true,
          sample: {
            num_rows: 1000,
            include_columns: []
          }
        },
        aggregation: {
          columns: {},
          dimensions: {},
          placement: 'centroid',
          resolution: 2,
          threshold: 2
        },
        sql: `SELECT * FROM ${DEFAULT_DATASET}`
      };

      expect(instantiateMapFromMock.mock.calls[0][0]).toStrictEqual(expectedmapConfig);
    });

    it('should add new dimensions and sample columns without removing previous ones', async () => {
      const mapOptions = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 512,
        bufferSize: {
          mvt: 30
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 5,
            includeNulls: false
          },
          sample: {
            num_rows: 1000,
            include_columns: ['column1']
          }
        },
        aggregation: {
          dimensions: {
            column1: {
              column: 'column1'
            }
          },
          placement: 'centroid',
          resolution: 2,
          threshold: 2
        }
      };

      const source = new DatasetSource(DEFAULT_DATASET, { mapOptions });
      await source.init({ sample: new Set(['column2']), aggregation: new Set(['column2']) });

      const expectedmapConfig = {
        vectorExtent: 2048,
        vectorSimplifyExtent: 512,
        bufferSize: {
          mvt: 30
        },
        metadata: {
          geometryType: true,
          columnStats: {
            topCategories: 5,
            includeNulls: false
          },
          dimensions: true,
          sample: {
            num_rows: 1000,
            include_columns: ['column1', 'column2']
          }
        },
        aggregation: {
          columns: {},
          dimensions: {
            column1: {
              column: 'column1'
            },
            column2: {
              column: 'column2'
            }
          },
          placement: 'centroid',
          resolution: 2,
          threshold: 2
        },
        sql: `SELECT * FROM ${DEFAULT_DATASET}`
      };

      expect(instantiateMapFromMock.mock.calls[0][0]).toStrictEqual(expectedmapConfig);
    });
  });
});
