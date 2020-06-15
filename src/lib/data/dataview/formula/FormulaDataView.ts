import { CartoError } from '../../../core/errors/CartoError';
import { Layer } from '../../../viz/layer/Layer';
import { CARTOSource } from '../../../viz/sources/CARTOSource';
import { DataView, DataViewData } from '../DataViewMode';
import { AggregationType, aggregate } from '../../operations/aggregation/aggregation';

export class FormulaDataView extends DataView {
  private operation: AggregationType;

  constructor(dataSource: CARTOSource | Layer, column: string, options: FormulaDataViewOptions) {
    const { operation } = options || {};
    validateParameters(operation, column);

    super(dataSource, column);

    this.operation = operation;
  }

  async getData(): Promise<Partial<DataViewData>> {
    const features = await this.getSourceData([this.column]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = features.map((feature: { [x: string]: any }) => feature[this.column]);
    validateNumbersOrNullIn(values);

    // just include numbers in calculations... TODO: should we consider features with null & undefined for the column?
    const filteredValues = values.filter(Number.isFinite);

    return {
      result: aggregate(filteredValues, this.operation),
      operation: this.operation,
      nullCount: values.length - filteredValues.length
    };
  }
}

function validateParameters(operation: AggregationType, column: string) {
  if (!operation) {
    throw new CartoError({
      type: '[DataView]',
      message:
        'Operation property not provided while creating dataview. Please check documentation.'
    });
  }

  if (!column) {
    throw new CartoError({
      type: '[DataView]',
      message: 'Column property not provided while creating dataview. Please check documentation.'
    });
  }
}

/**
 * Check the values are numbers or null | undefined, taking a small sample
 * @param features
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateNumbersOrNullIn(values: any[]) {
  const sample = values.slice(0, Math.min(values.length, 10));
  sample.forEach(value => {
    const isAcceptedNull = value === null || value === undefined; // TODO should we just support null?

    if (!isAcceptedNull && typeof value !== 'number') {
      throw new CartoError({
        type: '[DataView]',
        message: `Column property for Formula can just contain numbers (or nulls) and a ${typeof value} with ${value} value was found. Please check documentation.`
      });
    }
  });
}

interface FormulaDataViewOptions {
  operation: AggregationType;
}
