import { Layer, Source } from '@/viz';
import { AggregationType } from '../../data/operations/aggregation/aggregation';
import { DataViewData, DataViewModeBase } from '../mode/DataViewModeBase';
import { DataViewBase } from '../DataViewBase';

export abstract class FormulaBase<T extends DataViewModeBase<Layer | Source>> extends DataViewBase<
  T
> {
  constructor(dataView: T, options: FormulaDataViewOptions, events: string[] = ['optionChanged']) {
    super(dataView, options, events);
  }

  public abstract async getData(): Promise<Partial<DataViewData>>;
}

export interface FormulaDataViewOptions {
  operation: AggregationType;
}
