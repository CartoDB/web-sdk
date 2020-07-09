import { AggregationType, aggregate } from '../../../data/operations/aggregation/aggregation';
import { DataViewImpl } from '../DataViewImpl';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class FormulaDataViewImpl extends DataViewImpl<FormulaDataViewData> {
  public async getLocalData(): Promise<FormulaDataViewData> {
    const dataviewLocal = this.dataView as DataViewLocal;

    try {
      const features = await dataviewLocal.getSourceData();

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
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }
  }

  public async getRemoteData(options: { filterId: string }): Promise<FormulaDataViewData> {
    const dataviewRemote = this.dataView as DataViewRemote;

    try {
      const filterApplicator = dataviewRemote.getFilterApplicator();
      const bbox = filterApplicator.getBbox();
      const dataviewsApiResponse = await dataviewRemote.dataviewsApi.formula({
        column: this.column,
        operation: this.operation,
        bbox
      });

      dataviewRemote.updateDataViewSource(options);

      if (
        dataviewsApiResponse.errors_with_context &&
        dataviewsApiResponse.errors_with_context.length > 0
      ) {
        const { message, type } = dataviewsApiResponse.errors_with_context[0];
        throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
      }

      const { result, nulls } = dataviewsApiResponse;

      return {
        result,
        operation: this.operation,
        nullCount: nulls
      };
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }
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
      throw new CartoDataViewError(
        `Column property for Formula can just contain numbers (or nulls) and a ${typeof value} with ${value} value was found. Please check documentation.`,
        dataViewErrorTypes.PROPERTY_INVALID
      );
    }
  });
}

export interface FormulaDataViewData {
  result: number;
  operation: AggregationType;
  nullCount: number;
}

export interface FormulaDataViewOptions {
  operation: AggregationType;
}
