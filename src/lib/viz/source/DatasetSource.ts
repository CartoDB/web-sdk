import { SQLSource, SourceOptions, defaultMapOptions } from './SQLSource';

/**
 * Implementation of a Source compatible with CARTO's MAPs API
 * * */
export class DatasetSource extends SQLSource {
  constructor(dataset: string, options: SourceOptions = {}) {
    super('', options);
    const { mapOptions = {} } = options;

    this.id = `CARTO-${dataset}`;
    this.sourceType = 'DatasetSource';

    this._value = dataset;
    const sourceOpts = { dataset };

    // Set Map Config
    this._mapConfig = {
      // hack: deep copy
      ...JSON.parse(JSON.stringify(defaultMapOptions)),
      ...mapOptions,
      ...sourceOpts
    };
  }
}
