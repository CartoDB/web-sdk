import { SQLSource, SourceOptions } from './SQLSource';

/**
 * Implementation of a Source compatible with CARTO's MAPs API
 * * */
export class DatasetSource extends SQLSource {
  constructor(dataset: string, options: SourceOptions = {}) {
    super('', options);

    this.id = `CARTO-${dataset}`;
    this.sourceType = 'DatasetSource';

    this._value = dataset;
  }
}
