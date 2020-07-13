import { isVariableDefined } from '@/core/utils/variables';
import { AggregationType, aggregate } from '@/data/operations/aggregation/aggregation';
import { DataViewMode, DataViewCalculation } from '../mode/DataViewMode';
import { DataViewImpl } from '../DataViewImpl';
import { CartoDataViewError, dataViewErrorTypes } from '../DataViewError';
import { DataViewLocal } from '../mode/DataViewLocal';
import { DataViewRemote } from '../mode/DataViewRemote';
import { DataViewOptions } from '../DataView';

export class HistogramDataViewImpl extends DataViewImpl<HistogramDataViewData> {
  options: HistogramDataViewOptions;

  constructor(dataView: DataViewMode, options: HistogramDataViewOptions) {
    super(dataView, { operation: AggregationType.COUNT });

    const { bins, start, end } = options;
    validateParameters(bins, start, end);

    this.options = options;
  }

  public async getLocalData(filterId?: string): Promise<HistogramDataViewData> {
    const dataviewLocal = this.dataView as DataViewLocal;
    const { bins = 10, start, end } = this.options;

    try {
      const features = (await dataviewLocal.getSourceData([this.column], { filterId })) as Record<
        string,
        number
      >[];
      const sortedFeatures = features.map(feature => feature[this.column]).sort((a, b) => a - b);

      const startValue = start ?? Math.min(...sortedFeatures);
      const endValue = end ?? Math.max(...sortedFeatures);
      let nulls = 0;

      const binsDistance = (endValue - startValue) / bins;
      const binsNumber = Array(bins)
        .fill(bins)
        .map((_, currentIndex) => ({
          bin: currentIndex,
          start: startValue + currentIndex * binsDistance,
          end: startValue + currentIndex * binsDistance + binsDistance,
          value: 0,
          values: [] as number[]
        }));

      sortedFeatures.forEach(feature => {
        const featureValue = feature;

        if (!featureValue) {
          nulls += 1;
          return;
        }

        const binContainer = binsNumber.find(
          bin => bin.start <= featureValue && bin.end > featureValue
        );

        if (!binContainer) {
          return;
        }

        binContainer.value += 1;
        binContainer.values.push(featureValue);
      });

      const transformedBins = binsNumber.map(binContainer => {
        return {
          bin: binContainer.bin,
          start: binContainer.start,
          end: binContainer.end,
          value: binContainer.value,
          min: aggregate(binContainer.values, AggregationType.MIN),
          max: aggregate(binContainer.values, AggregationType.MAX),
          avg: aggregate(binContainer.values, AggregationType.AVG),
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

  public async getRemoteData(): Promise<HistogramDataViewData> {
    const dataviewRemote = this.dataView as DataViewRemote;
    const { bins = 10, start, end } = this.options;

    try {
      const filterApplicator = dataviewRemote.getFilterApplicator();
      const bbox = filterApplicator.getBbox();

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
