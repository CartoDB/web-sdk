import { DataFilterExtension } from '@deck.gl/extensions';
import { GeoJsonProperties } from 'geojson';
import { CartoError } from '@/core/errors/CartoError';
import { ColumnFilters, FilterTypes } from './types';
import { FilterApplicator } from './FilterApplicator';

export enum FilterType {
  IN = 'IN',
  WITHIN = 'WITHIN'
}

export class FunctionFilterApplicator extends FilterApplicator<ColumnFilters> {
  getOptions() {
    return {
      getFilterValue: (f: GeoJSON.Feature) => this.applicator(f.properties || {}),
      filterRange: [1, 1],
      extensions: [new DataFilterExtension({ filterSize: 1 })]
    };
  }

  applicator(feature: GeoJsonProperties) {
    const columns = Object.keys(this.filters);

    if (!columns) {
      return 1;
    }

    const featurePassesFilter = columns.every(column => {
      const columnFilters = this.filters[column] as ColumnFilters;
      const columnFilterTypes = Object.keys(columnFilters as Record<string, unknown>);

      if (!feature || !feature[column]) {
        return false;
      }

      return columnFilterTypes.every(filter => {
        const filterFunction = filterFunctions[filter.toUpperCase() as FilterType];

        if (!filterFunction) {
          throw new CartoError({
            type: 'Layer',
            message: `"${filterFunction}" not implemented in FunctionFilterApplicator`
          });
        }

        return filterFunction(columnFilters[filter as FilterTypes], feature[column] || '');
      });
    });

    return Number(featurePassesFilter);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const filterFunctions: Record<FilterType, Function> = {
  [FilterType.IN](filterValues: string[], featureValue: string) {
    return filterValues.includes(featureValue);
  },

  [FilterType.WITHIN](filterValues: string[], featureValue: string) {
    const [lowerBound, upperBound] = filterValues;

    return featureValue >= lowerBound && featureValue < upperBound;
  }
};
