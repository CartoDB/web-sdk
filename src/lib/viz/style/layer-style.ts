import { Deck } from '@deck.gl/core';
import { Source } from '@/viz';

export interface StyledLayer {
  getMapInstance(): Deck;
  source: Source;
}
