import { Deck } from '@deck.gl/core';
import { Source } from '@/viz/source';

export interface StyledLayer {
  getMapInstance(): Deck;
  source: Source;
}
