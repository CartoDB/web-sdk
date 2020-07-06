// import { DataFilterExtension } from '@deck.gl/extensions';
// import { GeoJsonProperties } from 'geojson';
import { CartoError } from '@/core/errors/CartoError';
import { ColumnFilters, FilterTypes } from './types';
import { FilterApplicator } from './FilterApplicator';

export enum FilterType {
  IN = 'IN',
  WITHIN = 'WITHIN'
}

export class SQLFilterApplicator extends FilterApplicator<ColumnFilters> {
  getSQL() {
    const columns = Object.keys(this.filters || {});

    if (!columns.length) {
      return '';
    }

    return columns
      .map(column => {
        const columnFilters = this.filters[column] as ColumnFilters;
        const columnFilterTypes = Object.keys(columnFilters as Record<string, unknown>);

        return columnFilterTypes
          .map(filter => {
            const filterTransformation = filterTransform[filter.toUpperCase() as FilterType];

            if (!filterTransformation) {
              throw new CartoError({
                type: 'Layer',
                message: `"${filter.toUpperCase()}" not implemented in RemoteSQLFilterApplicator`
              });
            }

            return filterTransformation(columnFilters[filter as FilterTypes], column);
          })
          .join(' AND ');
      })
      .join(' AND ');
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
const filterTransform: Record<FilterType, Function> = {
  [FilterType.IN](filterValues: string[], column: string) {
    return `${column} IN (${filterValues.map(value => `'${value}'`).join(',')})`;
  },

  [FilterType.WITHIN](filterValues: number[] | number[][], column: string) {
    const transformSQL = function checkRange(range: number[]) {
      const [lowerBound, upperBound] = range;
      return `${column} BETWEEN ${lowerBound} AND ${upperBound}`;
    };

    return Array.isArray(filterValues[0])
      ? (filterValues as number[][]).map(transformSQL).join(' AND ')
      : transformSQL(filterValues as number[]);
  }
};
