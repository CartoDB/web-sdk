import { Stats } from '@/viz/source';
import { CartoStylingError, stylingErrorTypes } from '../errors/styling-error';
import { Layer } from '../layer';

export type ClassificationMethod = 'quantiles' | 'stdev' | 'equal';

export class Classifier {
  private dataOrigin: Stats | Layer;
  private featureProperty?: string;

  constructor(dataOrigin: Stats | Layer, featureProperty?: string) {
    this.dataOrigin = dataOrigin;
    this.featureProperty = featureProperty;
  }

  public breaks(nBreaks: number, method: ClassificationMethod, viewport = false) {
    validateParameters(this.dataOrigin, this.featureProperty, viewport, method);

    if (nBreaks === 0) {
      return [];
    }

    switch (method) {
      case 'quantiles':
        return this._quantilesBreaks(nBreaks, viewport);
      case 'equal':
        return this._equalBreaks(nBreaks, viewport);
      case 'stdev':
        return this._standarDev(nBreaks, undefined, viewport);

      default:
        throw new Error(`Unsupported classify method ${method}`);
    }
  }

  private async _quantilesBreaks(nBreaks: number, viewport = false): Promise<number[]> {
    const data = await this.getData(viewport);

    const breaks: number[] = [];

    if (data.length > 0) {
      const sortedSample = [...data].sort((x, y) => x - y);

      for (let i = 1; i <= nBreaks; i += 1) {
        const p = i / (nBreaks + 1);
        const index = Math.max(0, Math.floor(p * sortedSample.length) - 1);
        breaks.push(sortedSample[index]);
      }
    }

    return breaks;
  }

  private async _equalBreaks(nBreaks: number, viewport = false): Promise<number[]> {
    const { min, max } = await this.getMinMax(viewport);

    const breaks: number[] = [];

    if (min && max) {
      for (let i = 1; i <= nBreaks; i += 1) {
        const p = i / (nBreaks + 1);
        breaks.push(min + (max - min) * p);
      }
    }

    return breaks;
  }

  private async _standarDev(nBreaks: number, classSize = 1.0, viewport = false): Promise<number[]> {
    const data = await this.getData(viewport);
    const avg = await this.getAvg(viewport);
    // const stdev = this.getStdev(viewport);

    let breaks: number[] = [];

    if (avg && data.length > 0) {
      const stdev = standardDeviation(data, avg);

      const over = [];
      const under = [];
      const isEven = (nBreaks + 1) % 2 === 0;
      let factor = isEven ? 0.0 : 1.0; // if odd, central class is double sized
      let step;

      do {
        step = factor * (stdev * classSize);
        over.push(avg + step);
        under.push(avg - step);
        breaks = [...new Set(over.concat(under))];
        breaks.sort((a, b) => a - b);
        factor += 1;
      } while (breaks.length < nBreaks && step !== 0);
    }

    return breaks;
  }

  private async getData(viewport: boolean) {
    let data: number[] = [];

    const { featureProperty } = this;
    const layer = this.dataOrigin as Layer;
    const stats = this.dataOrigin as Stats;

    if (viewport && featureProperty) {
      try {
        const features = await layer.getViewportFeatures();
        data = features.filter(f => !!f[featureProperty]).map(f => f[featureProperty] as number);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err);
      }
    } else if (stats.sample) {
      data = stats.sample;
    }

    return data;
  }

  private async getMinMax(viewport: boolean) {
    let min;
    let max;

    const stats = this.dataOrigin as Stats;

    if (viewport) {
      const data = await this.getData(viewport);

      if (data.length > 0) {
        min = Math.min(...data);
        max = Math.max(...data);
      }
    } else {
      min = stats.min;
      max = stats.max;
    }

    return { min, max };
  }

  private async getAvg(viewport: boolean) {
    let avg;

    const stats = this.dataOrigin as Stats;

    if (viewport) {
      const data = await this.getData(viewport);

      if (data.length > 0) {
        avg = data.reduce((a, b) => a + b) / data.length;
      }
    } else {
      avg = stats.avg;
    }

    return avg;
  }
}

function validateParameters(
  dataOrigin: Stats | Layer,
  featureProperty: string | undefined,
  viewport: boolean,
  method: ClassificationMethod
) {
  if (viewport && !featureProperty) {
    throw new CartoStylingError(
      'The feature property should be provided when viewport is used',
      stylingErrorTypes.PROPERTY_MISSING
    );
  }

  if (method === 'quantiles') {
    if (viewport && !(dataOrigin instanceof Layer)) {
      throw new CartoStylingError(
        'You have to provide a Layer in order to calculate breaks for viewport features',
        stylingErrorTypes.PROPERTY_MISMATCH
      );
    } else if (!viewport && !(dataOrigin as Stats).sample) {
      throw new CartoStylingError(
        'Quantile method requires a sample in stats',
        stylingErrorTypes.CLASS_METHOD_UNSUPPORTED
      );
    }
  }
}

/**
 * Calculate Variance
 */
function variance(values: number[], avg: number): number[] {
  const variances = [];

  for (let i = 0; i < values.length; i += 1) {
    const diff = values[i] - avg;
    variances.push(diff * diff);
  }

  return variances;
}

/**
 * Calculate Standard Deviation (STD), using population deviation formula
 *
 * @param {Number[]} values
 * @returns {Number} - standard deviation
 */
function standardDeviation(values: number[], avg: number): number {
  const avgVariance = average(variance(values, avg));
  return Math.sqrt(avgVariance);
}

/**
 * Calculate Average
 */
function average(values: number[]): number {
  let sum = 0;

  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
  }

  return sum / values.length;
}
