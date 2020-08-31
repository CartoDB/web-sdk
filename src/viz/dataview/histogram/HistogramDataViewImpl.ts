import { isVariableDefined } from '@/core/utils/variables';
import { isDefined } from '@/viz/utils/object';
import { AggregationType, aggregateValues } from '@/data/operations/aggregation';
import { DataViewMode, DataViewCalculation } from '../mode/DataViewMode';
import { DataViewImpl, GetDataOptions } from '../DataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewOptions } from '../DataView';
import { getFeatureValue } from '../utils';

export class HistogramDataViewImpl extends DataViewImpl<HistogramDataViewData> {
  options: HistogramDataViewOptions;

  constructor(dataView: DataViewMode, options: HistogramDataViewOptions) {
    super(dataView, { operation: AggregationType.AVG });

    const { bins, start, end } = options;
    validateParameters(bins, start, end);

    this.options = options;
  }

  public async getLocalData(options: GetDataOptions): Promise<HistogramDataViewData> {
    const dataviewLocal = this.dataView as DataViewLocal;
    const { bins = 10, start, end } = this.options;

    const aggregatedColumnName = this.getAggregationColumnName();
    const columnName = this.column;

    try {
      const features = (await dataviewLocal.getSourceData(options)) as Record<string, number>[];
      let sortedFeatures: number[] = [];

      if (start === null || start === undefined || end === null || end === undefined) {
        sortedFeatures = features
          .map(feature => feature[aggregatedColumnName] || feature[columnName])
          .sort((a, b) => a - b);
      }

      const startValue = start ?? sortedFeatures[0];
      const endValue = end ?? sortedFeatures[sortedFeatures.length - 1];
      let nulls = 0;

      const binsDistance = (endValue - startValue) / bins;
      const binsContainer = Array(bins)
        .fill(bins)
        .map((_, currentIndex) => ({
          bin: currentIndex,
          start: startValue + currentIndex * binsDistance,
          end: startValue + currentIndex * binsDistance + binsDistance,
          value: 0,
          values: [] as number[]
        }));

      features.forEach(feature => {
        const { featureValue, clusterCount, containsAggregatedData } = getFeatureValue(
          feature,
          aggregatedColumnName,
          columnName
        );

        if (!isDefined(featureValue)) {
          nulls += 1;
          return;
        }

        const binContainer = binsContainer.find(
          bin => bin.start <= featureValue && bin.end > featureValue
        );

        if (!binContainer) {
          return;
        }

        binContainer.value += clusterCount || 1;
        binContainer.values.push(featureValue);
        this.containsAggregatedData = this.containsAggregatedData || containsAggregatedData;
      });

      const transformedBins = binsContainer.map(binContainer => {
        return {
          bin: binContainer.bin,
          start: binContainer.start,
          end: binContainer.end,
          value: binContainer.value,
          min: aggregateValues(binContainer.values, AggregationType.MIN).result,
          max: aggregateValues(binContainer.values, AggregationType.MAX).result,
          avg: aggregateValues(binContainer.values, AggregationType.AVG).result,
          normalized: binContainer.values.length / features.length
        };
      });

      return {
        bins: transformedBins,
        nulls,
        totalAmount: features.length
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  public async getRemoteData(options: GetDataOptions): Promise<HistogramDataViewData> {
    const dataviewRemote = this.dataView as DataViewRemote;
    const { bins = 10, start, end } = this.options;

    try {
      const filterApplicator = dataviewRemote.getFilterApplicator();
      const bbox = filterApplicator.getBbox();

      dataviewRemote.updateDataViewSource(options);

      const aggregationResponse = await dataviewRemote.dataviewsApi.histogram({
        bins,
        start,
        end,
        bbox,
        column: this.column
      });

      if (
        aggregationResponse.errors_with_context &&
        aggregationResponse.errors_with_context.length > 0
      ) {
        const { message, type } = aggregationResponse.errors_with_context[0];
        throw new CartoDataViewError(`${type}: ${message}`, dataViewErrorTypes.MAPS_API);
      }

      const transformedBins = aggregationResponse.bins.map(
        (binContainer: Record<string, number>) => ({
          min: binContainer.min,
          max: binContainer.max,
          avg: binContainer.avg,
          bin: binContainer.bin,
          value: binContainer.freq,
          normalized: binContainer.freq / aggregationResponse.totalAmount,
          start: aggregationResponse.bins_start + binContainer.bin * aggregationResponse.bin_width,
          end:
            aggregationResponse.bins_start +
            binContainer.bin * aggregationResponse.bin_width +
            aggregationResponse.bin_width
        })
      );

      return {
        bins: transformedBins,
        nulls: aggregationResponse.nulls,
        totalAmount: aggregationResponse.totalAmount
      };
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

function validateParameters(
  bins: number | undefined,
  start: number | undefined = 0,
  end: number | undefined = 0
) {
  if (bins && !Number.isInteger(bins)) {
    throw new CartoDataViewError(
      'Bins property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(start) && !Number.isInteger(start)) {
    throw new CartoDataViewError(
      'Start property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(end) && !Number.isInteger(end)) {
    throw new CartoDataViewError(
      'End property value is not valid. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }

  if (isVariableDefined(start) && isVariableDefined(end) && start > end) {
    throw new CartoDataViewError(
      'Start should be greater than end. Please check documentation.',
      dataViewErrorTypes.PROPERTY_INVALID
    );
  }
}

export interface BinData {
  min: number;
  max: number;
  avg: number;
  normalized: number;
  bin: number;
  start: number;
  end: number;
  value: number;
}

export interface HistogramDataViewData {
  bins: BinData[];
  nulls: number;
  totalAmount: number;
}

export interface HistogramDataViewOptions extends DataViewOptions {
  bins?: number;
  start?: number;
  end?: number;
  mode?: DataViewCalculation;
}
