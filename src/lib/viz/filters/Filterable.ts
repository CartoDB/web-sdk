import { WithEvents } from '@/core/mixins/WithEvents';
import { Filter } from './types';

export abstract class Filterable extends WithEvents {
  public abstract addFilter(filterId: string, filter: Filter): Promise<void>;
  public abstract removeFilter(filterId: string): Promise<void>;
}
