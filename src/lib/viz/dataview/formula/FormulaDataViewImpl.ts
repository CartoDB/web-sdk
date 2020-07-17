import { AggregationType, aggregateValues } from '@/data/operations/aggregation';
import {
  aggregateFeatures,
  AggregatedFeatureProperties
} from '@/data/operations/aggregation/feature/feature-aggregation';
import { DataViewImpl, GetDataOptions } from '../DataViewImpl';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';

export class FormulaDataViewImpl extends DataViewImpl<FormulaDataViewData> {
  public async getLocalData(): Promise<FormulaDataViewData> {
    const dataviewLocal = this.dataView as DataViewLocal;

    try {
      const features = await dataviewLocal.getSourceData({
        aggregationOptions: {
          numeric: [
            {
              column: this.column,
              operations: [this.operation]
            }
          ]
        }
      });

      const aggregatedColumnName = `_cdb_${this.operation}__${this.column}`;
      const columnName = this.column;

      const containsAggregatedData = aggregatedColumnName in features[0];

      const values = containsAggregatedData
        ? features.map((feature: Record<string, unknown>) => ({
            aggregatedValue: feature[aggregatedColumnName],
            featureCount: feature._cdb_feature_count
          }))
        : features.map((feature: Record<string, unknown>) => feature[columnName]);

      const aggregation = containsAggregatedData
        ? aggregateFeatures(values as AggregatedFeatureProperties[], this.operation)
        : aggregateValues(values as number[], this.operation);

      return {
        result: aggregation.result,
        nullCount: aggregation.nullCount,
        operation: this.operation
      };
    } catch (error) {
      this.emit('error', [error]);
      throw error;
    }
  }

  public async getRemoteData(options: GetDataOptions): Promise<FormulaDataViewData> {
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

export interface FormulaDataViewData {
  result: number;
  operation: AggregationType;
  nullCount: number;
}

export interface FormulaDataViewOptions {
  operation: AggregationType;
}
