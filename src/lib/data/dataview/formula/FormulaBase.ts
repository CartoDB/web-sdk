import { Layer, Source } from '@/viz';
import { AggregationType } from '../../operations/aggregation/aggregation';
import { DataViewData, DataViewMode } from '../DataViewMode';
import { DataViewBase } from '../DataViewBase';

export abstract class FormulaBase<T extends DataViewMode<Layer | Source>> extends DataViewBase<T> {
  constructor(dataView: T, options: FormulaDataViewOptions, events: string[] = ['optionChanged']) {
    super(dataView, options, events);
  }

  public abstract async getData(): Promise<Partial<DataViewData>>;
}

export interface FormulaDataViewOptions {
  operation: AggregationType;
}
